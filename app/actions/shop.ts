'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { clampInt } from '@/lib/shop/money'
import { calcShippingCostKopeks, ShippingMethod } from '@/lib/shop/shipping'
import { logAudit } from '@/lib/audit'
import { makeTbankToken, tbankInit } from '@/lib/shop/tbank'

async function requireUserId() {
  const session = await getSession()
  if (!session?.userId) redirect('/login')
  return { userId: parseInt(session.userId, 10), role: session.role }
}

async function getOrCreateCartId(prisma: ReturnType<typeof getPrisma>, userId: number) {
  const cart = await prisma.shopCart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  })
  return cart.id
}

export async function addToCart(productId: number, quantity: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const { userId } = await requireUserId()

  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true, stock: true, priceKopeks: true },
  })

  if (!product || !product.isActive) return { ok: false as const, error: 'Товар недоступен' }

  const qty = clampInt(quantity, 1, 99)
  const allowed = product.stock > 0 ? Math.min(qty, product.stock) : qty

  const cartId = await getOrCreateCartId(prisma, userId)

  await prisma.shopCartItem.upsert({
    where: { cartId_productId: { cartId, productId: product.id } },
    create: { cartId, productId: product.id, quantity: allowed, unitPriceKopeks: product.priceKopeks },
    update: { quantity: { increment: allowed }, unitPriceKopeks: product.priceKopeks },
  })

  revalidatePath('/cart')
  return { ok: true as const }
}

export async function setCartItemQuantity(productId: number, quantity: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const { userId } = await requireUserId()

  const cart = await prisma.shopCart.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!cart) return { ok: true as const }

  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { id: true, stock: true, priceKopeks: true, isActive: true },
  })
  if (!product || !product.isActive) {
    await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id, productId } })
    revalidatePath('/cart')
    return { ok: true as const }
  }

  const qty = clampInt(quantity, 0, 99)
  if (qty <= 0) {
    await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id, productId } })
    revalidatePath('/cart')
    return { ok: true as const }
  }

  const allowed = product.stock > 0 ? Math.min(qty, product.stock) : qty

  await prisma.shopCartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { quantity: allowed, unitPriceKopeks: product.priceKopeks },
  })

  revalidatePath('/cart')
  return { ok: true as const }
}

export async function clearCart(csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const { userId } = await requireUserId()
  const cart = await prisma.shopCart.findUnique({ where: { userId }, select: { id: true } })
  if (!cart) return { ok: true as const }

  await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id } })
  revalidatePath('/cart')
  return { ok: true as const }
}

export async function createShopOrder(data: {
  shippingMethod: ShippingMethod
  paymentProvider: 'tbank' | 'yookassa' | 'sber_online' | 'tinkoff_online'
  contactName: string
  contactPhone: string
  contactEmail: string
  deliveryCity?: string
  deliveryAddress?: string
  deliveryPostalCode?: string
  comment?: string
  csrfToken: string
}) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(data.csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const { userId } = await requireUserId()

  const cart = await prisma.shopCart.findUnique({
    where: { userId },
    select: { id: true, items: { include: { product: { select: { id: true, name: true, sku: true, priceKopeks: true, isActive: true, stock: true } } } } },
  })
  if (!cart || cart.items.length === 0) return { ok: false as const, error: 'Корзина пуста' }

  const items = cart.items
    .filter((i) => i.product && i.product.isActive)
    .map((i) => {
      const unit = i.product!.priceKopeks
      const qty = i.product!.stock > 0 ? Math.min(i.quantity, i.product!.stock) : i.quantity
      return {
        productId: i.product!.id,
        productName: i.product!.name,
        sku: i.product!.sku,
        quantity: qty,
        unitPriceKopeks: unit,
        totalKopeks: unit * qty,
      }
    })

  if (items.length === 0) return { ok: false as const, error: 'Товары недоступны' }

  const shippingCostKopeks = calcShippingCostKopeks(data.shippingMethod)
  const subtotal = items.reduce((sum, i) => sum + i.totalKopeks, 0)
  const totalKopeks = subtotal + shippingCostKopeks

  const order = await prisma.shopOrder.create({
    data: {
      userId,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentProvider: data.paymentProvider,
      shippingMethod: data.shippingMethod,
      shippingCostKopeks,
      totalKopeks,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      deliveryCity: data.deliveryCity || null,
      deliveryAddress: data.deliveryAddress || null,
      deliveryPostalCode: data.deliveryPostalCode || null,
      comment: data.comment || null,
      items: {
        create: items,
      },
    },
    select: { id: true, orderNo: true },
  })

  await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id } })

  await logAudit({
    actorUserId: userId,
    action: 'shop.order.create',
    target: String(order.orderNo),
    metadata: { orderId: order.id, totalKopeks, shippingMethod: data.shippingMethod, provider: data.paymentProvider },
  })

  revalidatePath('/cart')
  revalidatePath('/checkout')
  return { ok: true as const, orderId: order.id, orderNo: order.orderNo }
}

export async function startTbankPayment(orderId: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const { userId, role } = await requireUserId()

  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return { ok: false as const, error: 'Заказ не найден' }
  if (role !== 'admin' && order.userId !== userId) return { ok: false as const, error: 'Недостаточно прав' }

  const terminalKey = process.env.TBANK_TERMINAL_KEY
  const password = process.env.TBANK_PASSWORD
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!terminalKey || !password || !siteUrl) {
    return { ok: false as const, error: 'Оплата ТБанк не настроена' }
  }

  const notificationURL = `${siteUrl.replace(/\/$/, '')}/api/payments/tbank`
  const successURL = `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}`
  const failURL = `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}?payment=failed`

  const payload: Record<string, unknown> = {
    TerminalKey: terminalKey,
    Amount: order.totalKopeks,
    OrderId: String(order.orderNo),
    Description: `Reality3D магазин: заказ #${order.orderNo}`,
    NotificationURL: notificationURL,
    SuccessURL: successURL,
    FailURL: failURL,
  }

  payload.Token = makeTbankToken(payload, password)

  const init = await tbankInit(payload)
  if (!init.ok || !init.json.Success || !init.json.PaymentURL || !init.json.PaymentId) {
    await prisma.shopPayment.create({
      data: {
        orderId: order.id,
        provider: 'tbank',
        status: 'failed',
        amountKopeks: order.totalKopeks,
        rawPayload: JSON.stringify({ request: payload, response: init.json }),
      },
    })
    return { ok: false as const, error: init.json.Message || init.json.Details || 'Ошибка создания оплаты' }
  }

  const payment = await prisma.shopPayment.create({
    data: {
      orderId: order.id,
      provider: 'tbank',
      status: 'pending',
      amountKopeks: order.totalKopeks,
      externalPaymentId: String(init.json.PaymentId),
      paymentUrl: init.json.PaymentURL,
      rawPayload: JSON.stringify({ request: payload, response: init.json }),
    },
    select: { id: true, paymentUrl: true, externalPaymentId: true },
  })

  await prisma.shopOrder.update({
    where: { id: order.id },
    data: { paymentProvider: 'tbank' },
  })

  await logAudit({
    actorUserId: userId,
    action: 'shop.payment.tbank.init',
    target: String(order.orderNo),
    metadata: { orderId: order.id, paymentId: payment.id, externalPaymentId: payment.externalPaymentId },
  })

  return { ok: true as const, paymentUrl: payment.paymentUrl }
}
