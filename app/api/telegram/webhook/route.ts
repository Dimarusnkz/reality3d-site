import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { getDefaultWarehouseId } from '@/lib/warehouse/default-warehouse';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    // Handle Callback Query
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const data = callbackQuery.data;
      const chatId = String(callbackQuery.message.chat.id);
      const messageId = callbackQuery.message.message_id;

      // 1. Security Check: Is the chat authorized?
      const prisma = getPrisma();
      const subscriber = await prisma.telegramSubscriber.findUnique({
        where: { chatId }
      });

      // Also check env if no subscribers in DB
      const envChatIds = process.env.TELEGRAM_CHAT_ID?.split(',').map(id => id.trim()) || [];
      const isAuthorized = subscriber || envChatIds.includes(chatId);

      if (!isAuthorized) {
        await answerCallbackQuery(callbackQuery.id, 'У вас нет прав для этого действия');
        return NextResponse.json({ ok: true });
      }

      // 2. Parse Action
      if (data.startsWith('confirm_payment:')) {
        const [_, type, orderId] = data.split(':');
        
        if (type === 'shop') {
          await handleShopPaymentConfirmation(orderId, chatId, callbackQuery.id, messageId);
        } else if (type === 'calc') {
          await handleCalcPaymentConfirmation(orderId, chatId, callbackQuery.id, messageId);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
    }),
  });
}

async function updateTelegramMessage(chatId: string, messageId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
    }),
  });
}

async function handleShopPaymentConfirmation(orderId: string, chatId: string, callbackId: string, messageId: number) {
  const prisma = getPrisma();
  
  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      await answerCallbackQuery(callbackId, 'Заказ не найден');
      return;
    }

    if (order.paymentStatus === 'paid') {
      await answerCallbackQuery(callbackId, 'Заказ уже оплачен');
      return;
    }

    const defaultWarehouseId = await getDefaultWarehouseId(prisma);

    // Logic from confirmShopOrderPaymentAdmin
    await prisma.$transaction(async (tx) => {
      const paymentId = `telegram-manual-${order.orderNo}-${Date.now()}`;
      const createdPayment = await tx.shopPayment.create({
        data: {
          orderId: order.id,
          provider: 'telegram_manual',
          status: 'succeeded',
          amountKopeks: order.totalKopeks,
          currency: 'RUB',
          externalPaymentId: paymentId,
          paymentUrl: '',
        },
      });

      await tx.shopOrder.update({
        where: { id: order.id },
        data: { paymentStatus: 'paid', status: 'paid', paymentProvider: 'telegram_manual' },
      });

      // Inventory write-off
      for (const item of order.items) {
        if (!item.productId) continue;
        const inv = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: defaultWarehouseId } },
          create: { productId: item.productId, warehouseId: defaultWarehouseId, unit: 'pcs', quantity: 0, reserved: 0, minThreshold: 0 },
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

      // Cash account entry
      const account = await tx.cashAccount.findFirst({ where: { code: { in: ['bank', 'online'] } } });
      if (account) {
        await tx.cashEntry.create({
          data: {
            accountId: account.id,
            direction: 'income',
            entryType: 'order_payment',
            amountKopeks: order.totalKopeks,
            currency: 'RUB',
            description: `Оплата заказа #${order.orderNo} (через Telegram)`,
            status: 'confirmed',
            shopOrderId: order.id,
            shopPaymentId: createdPayment.id,
          },
        });
      }
    });

    await logAudit({
      actorUserId: null, // System/Bot action
      action: 'shop.order.payment.confirm.telegram',
      target: String(order.orderNo),
      metadata: { orderId: order.id, chatId },
    });

    await answerCallbackQuery(callbackId, 'Оплата подтверждена!');
    await updateTelegramMessage(chatId, messageId, `✅ <b>ОПЛАТА ПОДТВЕРЖДЕНА</b> для заказа #${order.orderNo}\nСумма: <b>${(order.totalKopeks / 100).toFixed(2)} ₽</b>`);

  } catch (error) {
    console.error('handleShopPaymentConfirmation error:', error);
    await answerCallbackQuery(callbackId, 'Ошибка при подтверждении оплаты');
  }
}

async function handleCalcPaymentConfirmation(orderIdStr: string, chatId: string, callbackId: string, messageId: number) {
  const prisma = getPrisma();
  const orderId = parseInt(orderIdStr, 10);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      await answerCallbackQuery(callbackId, 'Заказ не найден');
      return;
    }

    if (order.status === 'paid') {
      await answerCallbackQuery(callbackId, 'Заказ уже оплачен');
      return;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' }
    });

    await logAudit({
      actorUserId: null,
      action: 'order.payment.confirm.telegram',
      target: String(orderId),
      metadata: { orderId, chatId },
    });

    await answerCallbackQuery(callbackId, 'Статус заказа обновлен на "Оплачен"');
    await updateTelegramMessage(chatId, messageId, `✅ <b>СТАТУС ОБНОВЛЕН: ОПЛАЧЕН</b> для заказа #${orderId}\n${order.title}`);

  } catch (error) {
    console.error('handleCalcPaymentConfirmation error:', error);
    await answerCallbackQuery(callbackId, 'Ошибка при обновлении статуса');
  }
}
