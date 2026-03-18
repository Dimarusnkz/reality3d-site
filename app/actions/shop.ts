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
import { getLogMeta } from '@/lib/shop/log-meta'

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
  const meta = await getLogMeta()

  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true, stock: true, priceKopeks: true, allowPreorder: true },
  })

  if (!product || !product.isActive) return { ok: false as const, error: 'Товар недоступен' }
  if (!product.allowPreorder && product.stock <= 0) return { ok: false as const, error: 'Нет в наличии' }

  const qty = clampInt(quantity, 1, 99)

  const cartId = await getOrCreateCartId(prisma, userId)

  const existing = await prisma.shopCartItem.findUnique({
    where: { cartId_productId: { cartId, productId: product.id } },
    select: { quantity: true },
  })
  const current = existing?.quantity ?? 0
  const nextWanted = current + qty
  const nextQty = product.allowPreorder ? nextWanted : Math.min(nextWanted, Math.max(0, product.stock))

  if (!product.allowPreorder && nextQty <= current) {
    return { ok: false as const, error: `Недостаточно товара. Доступно ${product.stock} шт.` }
  }

  await prisma.shopCartItem.upsert({
    where: { cartId_productId: { cartId, productId: product.id } },
    create: { cartId, productId: product.id, quantity: nextQty, unitPriceKopeks: product.priceKopeks },
    update: { quantity: nextQty, unitPriceKopeks: product.priceKopeks },
  })

  await prisma.shopClientLog.create({
    data: {
      userId,
      actionType: 'cart_add',
      productId: product.id,
      quantity: nextQty - current,
      unit: 'pcs',
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      message: `Добавил в корзину: ${product.id} (+${nextQty - current})`,
    },
  })

  revalidatePath('/cart')
  return { ok: true as const }
}

export async function setCartItemQuantity(productId: number, quantity: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const { userId } = await requireUserId()
  const meta = await getLogMeta()

  const cart = await prisma.shopCart.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!cart) return { ok: true as const }

  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: { id: true, stock: true, priceKopeks: true, isActive: true, allowPreorder: true },
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

  if (!product.allowPreorder && product.stock <= 0) {
    await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id, productId } })
    revalidatePath('/cart')
    return { ok: true as const }
  }

  const allowed = product.allowPreorder ? qty : Math.min(qty, product.stock)

  await prisma.shopCartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { quantity: allowed, unitPriceKopeks: product.priceKopeks },
  })

  await prisma.shopClientLog.create({
    data: {
      userId,
      actionType: 'cart_update',
      productId: product.id,
      quantity: allowed,
      unit: 'pcs',
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      message: `Изменил количество в корзине: ${product.id} (=${allowed})`,
    },
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
  const meta = await getLogMeta()

  const cart = await prisma.shopCart.findUnique({
    where: { userId },
    select: {
      id: true,
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, priceKopeks: true, isActive: true, stock: true, allowPreorder: true } },
        },
      },
    },
  })
  if (!cart || cart.items.length === 0) return { ok: false as const, error: 'Корзина пуста' }

  const items = cart.items
    .filter((i) => i.product && i.product.isActive)
    .map((i) => {
      const unit = i.product!.priceKopeks
      return {
        productId: i.product!.id,
        productName: i.product!.name,
        sku: i.product!.sku,
        quantity: i.quantity,
        unitPriceKopeks: unit,
        totalKopeks: unit * i.quantity,
        allowPreorder: i.product!.allowPreorder,
        freeStock: i.product!.stock,
      }
    })

  if (items.length === 0) return { ok: false as const, error: 'Товары недоступны' }
  for (const i of items) {
    if (!i.allowPreorder && (i.freeStock <= 0 || i.quantity > i.freeStock)) {
      return { ok: false as const, error: `Недостаточно товара. Доступно ${Math.max(0, i.freeStock)} шт.` }
    }
  }

  const shippingCostKopeks = calcShippingCostKopeks(data.shippingMethod)
  const subtotal = items.reduce((sum, i) => sum + i.totalKopeks, 0)
  const totalKopeks = subtotal + shippingCostKopeks

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.shopOrder.create({
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
          create: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            sku: i.sku,
            quantity: i.quantity,
            unitPriceKopeks: i.unitPriceKopeks,
            totalKopeks: i.totalKopeks,
          })),
        },
      },
      select: { id: true, orderNo: true },
    })

    for (const i of items) {
      if (i.allowPreorder) continue
      const inv = await tx.shopInventoryItem.upsert({
        where: { productId_warehouseId: { productId: i.productId, warehouseId: 1 } },
        create: { productId: i.productId, warehouseId: 1, unit: 'pcs', quantity: 0, reserved: 0, minThreshold: 0 },
        update: {},
      })
      const qty = Number(inv.quantity)
      const reserved = Number((inv as any).reserved ?? 0)
      const free = qty - reserved
      if (free < i.quantity) throw new Error('OUT_OF_STOCK')
      const nextReserved = reserved + i.quantity
      await tx.shopInventoryItem.update({ where: { id: inv.id }, data: { reserved: nextReserved } })
      await tx.shopProduct.update({ where: { id: i.productId }, data: { stock: Math.max(0, Math.trunc(qty - nextReserved)) } })
      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: userId,
          actorRole: 'user',
          actionType: 'reserve',
          reason: 'sale',
          productId: i.productId,
          warehouseId: 1,
          locationId: inv.locationId ?? null,
          sku: i.sku || null,
          productName: i.productName,
          quantityDelta: i.quantity,
          unit: 'pcs',
          shopOrderId: created.id,
          comment: `Резерв под заказ #${created.orderNo}`,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      })
    }

    await tx.shopCartItem.deleteMany({ where: { cartId: cart.id } })
    return created
  }).catch((e) => {
    if (e instanceof Error && e.message === 'OUT_OF_STOCK') return null
    throw e
  })

  if (!order) return { ok: false as const, error: 'Недостаточно товара' }

  await logAudit({
    actorUserId: userId,
    action: 'shop.order.create',
    target: String(order.orderNo),
    metadata: { orderId: order.id, totalKopeks, shippingMethod: data.shippingMethod, provider: data.paymentProvider },
  })

  await prisma.shopClientLog.create({
    data: {
      userId,
      actionType: 'checkout_create',
      shopOrderId: order.id,
      orderStatus: 'pending',
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      message: `Создал заказ #${order.orderNo}`,
    },
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
  const meta = await getLogMeta()

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

  await prisma.shopClientLog.create({
    data: {
      userId: order.userId || userId,
      actionType: 'payment_init',
      shopOrderId: order.id,
      orderStatus: order.paymentStatus,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      message: `Перешёл к оплате ТБанк: заказ #${order.orderNo}`,
    },
  })

  if (!payment.paymentUrl) {
    await prisma.shopPayment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    })
    return { ok: false as const, error: 'Ошибка создания ссылки оплаты' }
  }

  return { ok: true as const, paymentUrl: payment.paymentUrl }
}
