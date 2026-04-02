import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getDefaultWarehouseId } from "@/lib/warehouse/default-warehouse";
import { logAudit } from "@/lib/audit";
import { toKopeks } from "@/lib/shop/money";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

// Constants for FSM steps
const STEPS = {
  IDLE: "IDLE",
  WAITING_PHOTO: "WAITING_PHOTO",
  WAITING_NAME: "WAITING_NAME",
  WAITING_CATEGORY: "WAITING_CATEGORY",
  WAITING_PRICE: "WAITING_PRICE",
  WAITING_DESCRIPTION: "WAITING_DESCRIPTION",
  WAITING_CONFIRM: "WAITING_CONFIRM",
};

export async function POST(req: NextRequest) {
  const secret = process.env.MAX_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers.get("x-max-bot-api-secret");
    if (got !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const body = (await req.json().catch(() => null)) as any;
    if (!body) return NextResponse.json({ ok: true });

    const update = Array.isArray(body) ? body[0] : body;
    const updateType = update?.update_type || update?.type || update?.event_type;
    console.log("MAX webhook update type:", updateType);

    const message = update?.message || update?.body?.message || update?.event?.message || null;
    const recipient = message?.recipient || update?.recipient || null;
    const sender = message?.sender || update?.sender || null;

    const senderIdRaw = sender?.user_id ?? sender?.id ?? update?.user_id ?? null;
    const senderId =
      typeof senderIdRaw === "number" ? senderIdRaw : Number.parseInt(String(senderIdRaw || ""), 10);

    const chatOrUserIdRaw =
      recipient?.chat_id ??
      recipient?.user_id ??
      message?.chat_id ??
      message?.user_id ??
      update?.chat_id ??
      update?.user_id ??
      null;

    const chatOrUserId = Number.isFinite(senderId)
      ? senderId
      : typeof chatOrUserIdRaw === "number"
        ? chatOrUserIdRaw
        : Number.parseInt(String(chatOrUserIdRaw || ""), 10);

    if (!Number.isFinite(chatOrUserId)) return NextResponse.json({ ok: true });

    const prisma = getPrisma();

    if (updateType === "message_created" || updateType === "bot_started") {
      const name =
        (typeof sender?.name === "string" ? sender.name : null) ||
        (typeof sender?.username === "string" ? sender.username : null) ||
        null;

      await prisma.maxSubscriber.upsert({
        where: { chatId: String(chatOrUserId) },
        update: { name: name || undefined },
        create: { chatId: String(chatOrUserId), name: name || undefined },
      });

      const state = await prisma.maxBotState.findUnique({ where: { chatId: String(chatOrUserId) } });
      const text = (message?.text || "").trim();

      console.log(`MAX processing message from ${chatOrUserId}: "${text}" (state: ${state?.step || 'none'})`);

      if (updateType === "bot_started" || text === "/start") {
        if (state) await prisma.maxBotState.delete({ where: { chatId: String(chatOrUserId) } });
        await sendMaxDirect(
          chatOrUserId,
          `✅ MAX подключён.\nВаш MAX ID: ${chatOrUserId}\nПолучатель добавлен — уведомления начнут приходить.\n\nДоступные команды:\n/stock [SKU или название] — проверить остаток\n/lowstock — список товаров с низким остатком\n/status [номер заказа] — статус заказа\n/new_product — создать карточку товара`
        );
        return NextResponse.json({ ok: true });
      }

      // Handle FSM steps or commands
      if (text.startsWith("/") || ["остаток", "дефицит", "статус"].includes(text.toLowerCase())) {
        const lowText = text.toLowerCase();
        
        if (lowText === "/new_product") {
          if (state) await prisma.maxBotState.delete({ where: { chatId: String(chatOrUserId) } });
          await prisma.maxBotState.create({
            data: { chatId: String(chatOrUserId), step: STEPS.WAITING_PHOTO },
          });
          await sendMaxDirect(chatOrUserId, "🖼 Пришлите фото товара (одним сообщением).");
          return NextResponse.json({ ok: true });
        }

        // Reset state for other commands too
        if (state) await prisma.maxBotState.delete({ where: { chatId: String(chatOrUserId) } });

        if (lowText.startsWith("/stock") || lowText.startsWith("остаток")) {
          const query = text.replace(/\/stock|остаток/gi, "").trim();
          await handleStockCommand(chatOrUserId, query);
        } else if (lowText === "/lowstock" || lowText === "дефицит") {
          await handleLowStockCommand(chatOrUserId);
        } else if (lowText.startsWith("/status") || lowText.startsWith("статус")) {
          const query = text.replace(/\/status|статус/gi, "").trim();
          await handleOrderStatusCommand(chatOrUserId, query);
        }
        return NextResponse.json({ ok: true });
      }

      // Process FSM if state exists
      if (state) {
        await handleFsmStep(chatOrUserId, state, message);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    if (updateType === "message_callback" || updateType === "callback") {
      const callback = update?.callback || update?.message_callback || update;
      const callbackId = callback?.callback_id || update?.callback_id || update?.id;
      const payload = callback?.payload || callback?.data || update?.payload;

      if (!callbackId || typeof payload !== "string") return NextResponse.json({ ok: true });

      const actorIdRaw =
        callback?.user_id ??
        callback?.user?.user_id ??
        callback?.sender?.user_id ??
        callback?.from?.user_id ??
        update?.user_id ??
        update?.user?.user_id ??
        update?.sender?.user_id ??
        null;

      const actorId =
        typeof actorIdRaw === "number" ? actorIdRaw : Number.parseInt(String(actorIdRaw || ""), 10);
      const actorChatId = Number.isFinite(actorId) ? String(actorId) : "";

      const authorized = actorChatId
        ? await prisma.maxSubscriber.findFirst({ where: { chatId: actorChatId } })
        : null;

      if (!authorized) {
        await answerMaxCallback(callbackId, { notification: "Нет прав для этого действия" });
        return NextResponse.json({ ok: true });
      }

      if (payload.startsWith("confirm_payment:")) {
        const parts = payload.split(":");
        const kind = parts[1];
        const orderId = parts[2];
        if (kind === "shop") {
          await confirmShopPayment(orderId, actorChatId, callbackId);
        } else if (kind === "calc") {
          await confirmCalcPayment(Number(orderId), actorChatId, callbackId);
        }
      } else if (payload.startsWith("cat:")) {
        const categoryId = parseInt(payload.split(":")[1], 10);
        const state = await prisma.maxBotState.findUnique({ where: { chatId: actorChatId } });
        if (state && state.step === STEPS.WAITING_CATEGORY) {
          const data = JSON.parse(state.data);
          data.categoryId = categoryId;
          await prisma.maxBotState.update({
            where: { chatId: actorChatId },
            data: { step: STEPS.WAITING_PRICE, data: JSON.stringify(data) },
          });
          await sendMaxDirect(parseInt(actorChatId), "💰 Введите цену товара в рублях (например: 1500).");
          await answerMaxCallback(callbackId, { notification: "Категория выбрана" });
        }
      } else if (payload === "publish_product") {
        await finalizeProductCreation(actorChatId, callbackId);
      } else if (payload === "cancel_product") {
        await prisma.maxBotState.delete({ where: { chatId: actorChatId } });
        await sendMaxDirect(Number(actorChatId), "❌ Создание товара отменено.");
        await answerMaxCallback(callbackId, { notification: "Отменено" });
      }
    }
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function handleFsmStep(chatId: number, state: any, message: any) {
  const prisma = getPrisma();
  const data = JSON.parse(state.data);
  const text = (message?.text || "").trim();

  switch (state.step) {
    case STEPS.WAITING_PHOTO:
      const attachments = message?.attachments || [];
      const photo = attachments.find((a: any) => a.type === "image");
      if (!photo || !photo.url) {
        await sendMaxDirect(chatId, "⚠️ Пожалуйста, пришлите фото товара.");
        return;
      }

      try {
        const res = await fetch(photo.url);
        if (!res.ok) throw new Error("Failed to download image");
        const buffer = await res.arrayBuffer();

        const fileName = `max_${Date.now()}.jpg`;
        const uploadDir = process.env.PUBLIC_UPLOAD_DIR || join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, Buffer.from(buffer));

        data.imageUrls = [`/uploads/${fileName}`];
        await prisma.maxBotState.update({
          where: { chatId: String(chatId) },
          data: { step: STEPS.WAITING_NAME, data: JSON.stringify(data) },
        });
        await sendMaxDirect(chatId, "📝 Введите название товара.");
      } catch (e) {
        console.error("Image upload error:", e);
        await sendMaxDirect(chatId, "❌ Ошибка при загрузке фото. Попробуйте еще раз.");
      }
      break;

    case STEPS.WAITING_NAME:
      if (!text) return;
      data.name = text;
      data.slug = text
        .toLowerCase()
        .replace(/[^a-z0-9а-яё\s]/gi, "")
        .trim()
        .replace(/\s+/g, "-");
      
      // Basic slug transliteration or just keeping it simple for now
      // Better to use a library but let's stick to simple
      data.slug = data.slug.replace(/[а-яё]/g, (m: string) => {
        const map: any = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
        return map[m] || m;
      });

      const categories = await prisma.shopCategory.findMany({ take: 8 });
      const buttons = categories.map((c) => [{ type: "callback", text: c.name, payload: `cat:${c.id}` }]);

      await prisma.maxBotState.update({
        where: { chatId: String(chatId) },
        data: { step: STEPS.WAITING_CATEGORY, data: JSON.stringify(data) },
      });

      await sendMaxDirect(chatId, "📂 Выберите категорию товара:", {
        attachments: [{ type: "inline_keyboard", payload: { buttons } }],
      });
      break;

    case STEPS.WAITING_PRICE:
      const priceRub = parseFloat(text.replace(",", "."));
      if (isNaN(priceRub) || priceRub < 0) {
        await sendMaxDirect(chatId, "⚠️ Введите корректную цену (число).");
        return;
      }
      data.priceRub = priceRub;
      await prisma.maxBotState.update({
        where: { chatId: String(chatId) },
        data: { step: STEPS.WAITING_DESCRIPTION, data: JSON.stringify(data) },
      });
      await sendMaxDirect(chatId, "📜 Введите описание товара (или отправьте '-', чтобы пропустить).");
      break;

    case STEPS.WAITING_DESCRIPTION:
      data.description = text === "-" ? "" : text;
      await prisma.maxBotState.update({
        where: { chatId: String(chatId) },
        data: { step: STEPS.WAITING_CONFIRM, data: JSON.stringify(data) },
      });

      const summary = `✨ ПРЕВЬЮ ТОВАРА:\n\n📦 <b>${data.name}</b>\n💰 Цена: ${data.priceRub} ₽\n📝 Описание: ${data.description || "—"}`;
      await sendMaxDirect(chatId, summary, {
        attachments: [
          {
            type: "inline_keyboard",
            payload: {
              buttons: [
                [{ type: "callback", text: "✅ Опубликовать", payload: "publish_product" }],
                [{ type: "callback", text: "❌ Отмена", payload: "cancel_product" }],
              ],
            },
          },
        ],
      });
      break;
  }
}

async function finalizeProductCreation(chatId: string, callbackId: string) {
  const prisma = getPrisma();
  const state = await prisma.maxBotState.findUnique({ where: { chatId } });
  if (!state) return;

  const data = JSON.parse(state.data);

  try {
    const product = await prisma.shopProduct.create({
      data: {
        name: data.name,
        slug: `${data.slug}-${Date.now()}`,
        priceKopeks: Math.round(data.priceRub * 100),
        description: data.description,
        categoryId: data.categoryId,
        isActive: true,
        images: {
          create: data.imageUrls.map((url: string) => ({ url })),
        },
      },
    });

    await prisma.maxBotState.delete({ where: { chatId } });

    const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/shop/${product.slug}`;
    await sendMaxDirect(
      Number(chatId),
      `✅ <b>Товар успешно создан!</b>\n\n🔗 Ссылка на сайте:\n${productUrl}`
    );
    await answerMaxCallback(callbackId, { notification: "Успешно создано!" });
  } catch (e) {
    console.error("Product creation error:", e);
    await sendMaxDirect(Number(chatId), "❌ Ошибка при создании товара в базе данных.");
    await answerMaxCallback(callbackId, { notification: "Ошибка БД" });
  }
}

async function sendMaxDirect(id: number, text: string, options: any = {}) {
  try {
    const token = process.env.MAX_BOT_TOKEN;
    if (!token) return;

    const body = { text, ...options };
    const url = new URL("https://platform-api.max.ru/messages");
    url.searchParams.set("chat_id", String(id));

    const res1 = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null as any);

    if (res1 && res1.ok) {
      console.log(`MAX: Message sent to chat_id ${id}`);
      return;
    }

    const url2 = new URL("https://platform-api.max.ru/messages");
    url2.searchParams.set("user_id", String(id));
    const res2 = await fetch(url2.toString(), {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null as any);

    if (res2 && res2.ok) {
      console.log(`MAX: Message sent to user_id ${id}`);
    } else {
      console.error(`MAX: Failed to send message to ${id}. Status: ${res2?.status}. Body: ${await res2?.text().catch(() => "N/A")}`);
    }
  } catch (e) {
    console.error(`MAX: Error in sendMaxDirect for ${id}:`, e);
  }
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
        data: { paymentStatus: "paid", status: "packed", paymentProvider: "max_manual" },
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

async function confirmCalcPayment(orderId: number, actorChatId: string, callbackId: string) {
  const prisma = getPrisma();

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

async function handleStockCommand(chatId: number, query: string) {
  if (!query) {
    await sendMaxDirect(chatId, "⚠️ Введите SKU или название товара.\nПример: /stock R3D-123");
    return;
  }

  const prisma = getPrisma();
  const products = await prisma.shopProduct.findMany({
    where: {
      OR: [
        { sku: { contains: query } },
        { name: { contains: query } }
      ]
    },
    include: {
      inventoryItems: {
        include: { warehouse: true }
      }
    },
    take: 5
  });

  if (products.length === 0) {
    await sendMaxDirect(chatId, `❌ Товар "${query}" не найден.`);
    return;
  }

  let response = `🔎 РЕЗУЛЬТАТЫ ПОИСКА ("${query}"):\n\n`;
  for (const p of products) {
    response += `📦 <b>${p.name}</b>\n🆔 SKU: ${p.sku || "—"}\n`;
    if (p.inventoryItems.length === 0) {
      response += `⚠️ Нет данных об остатках\n`;
    } else {
      for (const inv of p.inventoryItems) {
        const available = Number(inv.quantity) - Number((inv as any).reserved ?? 0);
        response += `🏢 ${inv.warehouse.name}: <b>${available} ${inv.unit}</b> (Всего: ${inv.quantity}, Резерв: ${(inv as any).reserved ?? 0})\n`;
      }
    }
    response += `\n`;
  }

  await sendMaxDirect(chatId, response);
}

async function handleLowStockCommand(chatId: number) {
  const prisma = getPrisma();
  const lowStockItems = await prisma.shopInventoryItem.findMany({
    where: {
      minThreshold: { gt: 0 }
    },
    include: {
      product: true,
      warehouse: true
    }
  });

  const critical = lowStockItems.filter(item => {
    const available = Number(item.quantity) - Number((item as any).reserved ?? 0);
    return available <= Number(item.minThreshold);
  });

  if (critical.length === 0) {
    await sendMaxDirect(chatId, "✅ Все товары в достаточном количестве.");
    return;
  }

  let response = `⚠️ ТОВАРЫ С НИЗКИМ ОСТАТКОМ:\n\n`;
  for (const it of critical.slice(0, 15)) {
    const available = Number(it.quantity) - Number((it as any).reserved ?? 0);
    response += `📦 <b>${it.product.name}</b>\n📉 Остаток: ${available} ${it.unit} (Порог: ${it.minThreshold})\n🏢 Склад: ${it.warehouse.name}\n\n`;
  }

  if (critical.length > 15) {
    response += `...и ещё ${critical.length - 15} позиций.`;
  }

  await sendMaxDirect(chatId, response);
}

async function handleOrderStatusCommand(chatId: number, query: string) {
  if (!query) {
    await sendMaxDirect(chatId, "⚠️ Введите номер заказа.\nПример: /status 1234");
    return;
  }

  const prisma = getPrisma();
  const orderNo = parseInt(query, 10);
  
  const order = await prisma.shopOrder.findFirst({
    where: {
      OR: [
        ...(Number.isFinite(orderNo) ? [{ orderNo }] : []),
        { id: query }
      ]
    }
  });

  if (!order) {
    await sendMaxDirect(chatId, `❌ Заказ #${query} не найден.`);
    return;
  }

  const statusMap: Record<string, string> = {
    pending: "⏳ Ожидает оплаты",
    paid: "✅ Оплачен",
    processing: "📦 В обработке",
    shipped: "🚚 Отправлен",
    delivered: "🏁 Доставлен",
    cancelled: "❌ Отменен"
  };

  const response = 
    `📄 ИНФОРМАЦИЯ О ЗАКАЗЕ #${order.orderNo}\n\n` +
    `📊 Статус: ${statusMap[order.status] || order.status}\n` +
    `💳 Оплата: ${order.paymentStatus === "paid" ? "✅ Оплачено" : "❌ Не оплачено"}\n` +
    `💰 Сумма: ${(order.totalKopeks / 100).toFixed(2)} ₽\n` +
    `📅 Дата: ${order.createdAt.toLocaleDateString()}`;

  await sendMaxDirect(chatId, response);
}
