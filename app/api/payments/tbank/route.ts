import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { verifyTbankToken } from '@/lib/shop/tbank';

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
