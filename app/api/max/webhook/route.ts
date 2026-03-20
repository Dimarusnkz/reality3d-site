import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getDefaultWarehouseId } from "@/lib/warehouse/default-warehouse";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const secret = process.env.MAX_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers.get("x-max-bot-api-secret");
    if (got !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const body = await req.json().catch(() => null) as any;
    if (!body) return NextResponse.json({ ok: true });

    const update = Array.isArray(body) ? body[0] : body;
    const updateType = update?.update_type || update?.type;
    if (updateType !== "message_callback") return NextResponse.json({ ok: true });

    const callback = update?.callback || update?.message_callback || update;
    const callbackId = callback?.callback_id || update?.callback_id;
    const payload = callback?.payload || callback?.data;

    if (!callbackId || typeof payload !== "string") {
      return NextResponse.json({ ok: true });
    }

    const actorChatId =
      String(
        callback?.message?.recipient?.chat_id ??
          callback?.message?.recipient?.user_id ??
          callback?.recipient?.chat_id ??
          callback?.recipient?.user_id ??
          callback?.chat_id ??
          callback?.user_id ??
          ""
      ) || "";

    const prisma = getPrisma();
    const authorized = actorChatId
      ? await prisma.maxSubscriber.findFirst({ where: { chatId: actorChatId } })
      : null;

    if (!authorized) {
      await answerMaxCallback(callbackId, { notification: "Нет прав для этого действия" });
      return NextResponse.json({ ok: true });
    }

    if (payload.startsWith("confirm_payment:")) {
      const [, kind, orderId] = payload.split(":");
      if (kind === "shop") {
        await confirmShopPayment(orderId, actorChatId, callbackId);
      } else if (kind === "calc") {
        await confirmCalcPayment(orderId, actorChatId, callbackId);
      } else {
        await answerMaxCallback(callbackId, { notification: "Неизвестная команда" });
      }
    }
  } catch {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function answerMaxCallback(
  callbackId: string,
  input: { notification?: string; messageText?: string }
) {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) return;

  const url = new URL("https://platform-api.max.ru/answers");
  url.searchParams.set("callback_id", callbackId);

  const body: any = {};
  if (input.notification) body.notification = input.notification;
  if (input.messageText) body.message = { text: input.messageText };

  await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

async function confirmShopPayment(orderId: string, actorChatId: string, callbackId: string) {
  const prisma = getPrisma();

  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      await answerMaxCallback(callbackId, { notification: "Заказ не найден" });
      return;
    }

    if (order.paymentStatus === "paid") {
      await answerMaxCallback(callbackId, { notification: "Уже оплачен" });
      return;
    }

    const defaultWarehouseId = await getDefaultWarehouseId(prisma);

    await prisma.$transaction(async (tx) => {
      const paymentId = `max-manual-${order.orderNo}-${Date.now()}`;
      const createdPayment = await tx.shopPayment.create({
        data: {
          orderId: order.id,
          provider: "max_manual",
          status: "succeeded",
          amountKopeks: order.totalKopeks,
          currency: "RUB",
          externalPaymentId: paymentId,
          paymentUrl: "",
        },
      });

      await tx.shopOrder.update({
        where: { id: order.id },
        data: { paymentStatus: "paid", status: "paid", paymentProvider: "max_manual" },
      });

      for (const item of order.items) {
        if (!item.productId) continue;
        const inv = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: defaultWarehouseId } },
          create: { productId: item.productId, warehouseId: defaultWarehouseId, unit: "pcs", quantity: 0, reserved: 0, minThreshold: 0 },
          update: {},
        });

        const nextQty = Math.max(0, Number(inv.quantity) - item.quantity);
        const nextReserved = Math.max(0, Number((inv as any).reserved ?? 0) - item.quantity);

        await tx.shopInventoryItem.update({
          where: { id: inv.id },
          data: { quantity: nextQty, reserved: nextReserved },
        });

        await tx.shopProduct.update({
          where: { id: item.productId },
          data: { stock: Math.max(0, Math.trunc(nextQty - nextReserved)) },
        });
      }

      const account = await tx.cashAccount.findFirst({ where: { code: { in: ["bank", "online"] } } });
      if (account) {
        await tx.cashEntry.create({
          data: {
            accountId: account.id,
            direction: "income",
            entryType: "order_payment",
            amountKopeks: order.totalKopeks,
            currency: "RUB",
            description: `Оплата заказа #${order.orderNo} (через MAX)`,
            status: "confirmed",
            shopOrderId: order.id,
            shopPaymentId: createdPayment.id,
          },
        });
      }
    });

    await logAudit({
      actorUserId: null,
      action: "shop.order.payment.confirm.max",
      target: String(order.orderNo),
      metadata: { orderId: order.id, chatId: actorChatId },
    });

    await answerMaxCallback(callbackId, {
      notification: "Оплата подтверждена",
      messageText: `✅ ОПЛАТА ПОДТВЕРЖДЕНА для заказа #${order.orderNo}\nСумма: ${(order.totalKopeks / 100).toFixed(2)} ₽`,
    });
  } catch {
    await answerMaxCallback(callbackId, { notification: "Ошибка при подтверждении" });
  }
}

async function confirmCalcPayment(orderIdStr: string, actorChatId: string, callbackId: string) {
  const prisma = getPrisma();
  const orderId = parseInt(orderIdStr, 10);

  if (!Number.isFinite(orderId)) {
    await answerMaxCallback(callbackId, { notification: "Некорректный заказ" });
    return;
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      await answerMaxCallback(callbackId, { notification: "Заказ не найден" });
      return;
    }

    if (order.status === "paid") {
      await answerMaxCallback(callbackId, { notification: "Уже оплачен" });
      return;
    }

    await prisma.order.update({ where: { id: orderId }, data: { status: "paid" } });

    await logAudit({
      actorUserId: null,
      action: "order.payment.confirm.max",
      target: String(orderId),
      metadata: { orderId, chatId: actorChatId },
    });

    await answerMaxCallback(callbackId, {
      notification: "Статус обновлен",
      messageText: `✅ СТАТУС ОБНОВЛЕН: ОПЛАЧЕН для заказа #${orderId}\n${order.title || ""}`.trim(),
    });
  } catch {
    await answerMaxCallback(callbackId, { notification: "Ошибка при обновлении статуса" });
  }
}
