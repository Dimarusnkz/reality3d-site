import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { verifyTbankToken } from '@/lib/shop/tbank';
import crypto from 'crypto';

function normalizeStatus(status: string | null) {
  const value = (status || '').toUpperCase();
  if (!value) return 'unknown';
  return value;
}

function isPaidStatus(status: string) {
  return ['CONFIRMED', 'AUTHORIZED'].includes(status);
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  const password = process.env.TBANK_PASSWORD;
  if (password) {
    const ok = verifyTbankToken(body, password);
    if (!ok) return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentId = typeof body.PaymentId === 'string' || typeof body.PaymentId === 'number' ? String(body.PaymentId) : null;
  const orderNo = typeof body.OrderId === 'string' || typeof body.OrderId === 'number' ? String(body.OrderId) : null;
  const statusRaw = typeof body.Status === 'string' ? body.Status : null;
  const status = normalizeStatus(statusRaw);
  const success = typeof body.Success === 'boolean' ? body.Success : null;

  if (!paymentId && !orderNo) return NextResponse.json({ ok: false }, { status: 400 });

  const payment = paymentId
    ? await prisma.shopPayment.findFirst({ where: { provider: 'tbank', externalPaymentId: paymentId } })
    : null;

  const resolvedPayment =
    payment ||
    (orderNo
      ? await prisma.shopPayment.findFirst({
          where: { provider: 'tbank', order: { orderNo: parseInt(orderNo, 10) } },
          orderBy: { createdAt: 'desc' },
        })
      : null);

  if (!resolvedPayment) {
    await logAudit({
      actorUserId: null,
      action: 'shop.payment.tbank.webhook.unknown',
      target: orderNo || paymentId || null,
      metadata: { status, success, body },
    });
    return new Response('OK');
  }

  const nextStatus = success === false ? 'failed' : isPaidStatus(status) ? 'succeeded' : status.toLowerCase();

  await prisma.shopPayment.update({
    where: { id: resolvedPayment.id },
    data: {
      status: nextStatus,
      rawPayload: JSON.stringify(body),
    },
  });

  if (nextStatus === 'succeeded') {
    await prisma.shopOrder.update({
      where: { id: resolvedPayment.orderId },
      data: { paymentStatus: 'paid', status: 'paid' },
    });

    const alreadyWrittenOff = await prisma.shopWarehouseLog.findFirst({
      where: { shopOrderId: resolvedPayment.orderId, actionType: 'writeoff', reason: 'sale' },
      select: { id: true },
    })

    if (!alreadyWrittenOff) {
      const orderForWriteoff = await prisma.shopOrder.findUnique({
        where: { id: resolvedPayment.orderId },
        include: { items: true },
      })
      if (orderForWriteoff) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
        const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;
        const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;

        await prisma.$transaction(async (tx) => {
          for (const item of orderForWriteoff.items) {
            if (!item.productId) continue
            const inv = await tx.shopInventoryItem.upsert({
              where: { productId: item.productId },
              create: { productId: item.productId, unit: 'pcs', quantity: 0, minThreshold: 0 },
              update: {},
            })

            const nextQty = Number(inv.quantity) - item.quantity
            await tx.shopInventoryItem.update({
              where: { id: inv.id },
              data: { quantity: nextQty },
            })

            await tx.shopProduct.update({
              where: { id: item.productId },
              data: { stock: Math.max(0, Math.trunc(nextQty)) },
            })

            const unitCostKopeks = inv.lastPurchaseUnitCostKopeks ?? null
            const totalCostKopeks = unitCostKopeks == null ? null : unitCostKopeks * item.quantity

            await tx.shopWarehouseLog.create({
              data: {
                actorUserId: null,
                actorRole: 'system',
                actionType: 'writeoff',
                reason: 'sale',
                productId: item.productId,
                sku: item.sku || null,
                productName: item.productName,
                quantityDelta: -item.quantity,
                unit: 'pcs',
                unitCostKopeks,
                totalCostKopeks,
                shopOrderId: resolvedPayment.orderId,
                serviceOrderId: null,
                supplier: null,
                documentNo: null,
                comment: `Автосписание по оплате заказа #${orderForWriteoff.orderNo}`,
                ipHash,
                userAgent,
              },
            })
          }
        })
      }
    }

    const existing = await prisma.cashEntry.findUnique({ where: { shopPaymentId: resolvedPayment.id }, select: { id: true } });
    if (!existing) {
      const account = await prisma.cashAccount.findUnique({ where: { code: 'online' }, select: { id: true } });
      if (account) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
        const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;
        const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null;

        await prisma.cashEntry.create({
          data: {
            accountId: account.id,
            direction: 'income',
            entryType: 'order_payment',
            amountKopeks: resolvedPayment.amountKopeks,
            currency: 'RUB',
            description: `Оплата заказа ${orderNo || ''}`.trim(),
            status: 'confirmed',
            shopOrderId: resolvedPayment.orderId,
            shopPaymentId: resolvedPayment.id,
            warehouseLogId: null,
            createdByUserId: null,
            ipHash,
            userAgent,
          },
        });
      }
    }
  } else if (nextStatus === 'failed') {
    await prisma.shopOrder.update({
      where: { id: resolvedPayment.orderId },
      data: { paymentStatus: 'failed' },
    });
  }

  const order = await prisma.shopOrder.findUnique({ where: { id: resolvedPayment.orderId }, select: { orderNo: true } });

  await logAudit({
    actorUserId: null,
    action: 'shop.payment.tbank.webhook',
    target: order ? String(order.orderNo) : orderNo,
    metadata: { paymentId, status, mappedStatus: nextStatus, success },
  });

  return new Response('OK');
}
