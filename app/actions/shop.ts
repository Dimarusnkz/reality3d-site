'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { clampInt } from '@/lib/shop/money'
import { calcShippingCostKopeks, getShippingMethodLabel, ShippingMethod } from '@/lib/shop/shipping'
import { logAudit } from '@/lib/audit'
import { makeTbankToken, tbankInit } from '@/lib/shop/tbank'
import { getLogMeta } from '@/lib/shop/log-meta'
import crypto from 'crypto'
import { getClientIp, getUserAgent } from '@/lib/request'
import { rateLimit } from '@/lib/rate-limit'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid'
import { quoteShipping } from '@/lib/shop/shipping-providers'
import { getDefaultWarehouseId } from '@/lib/warehouse/default-warehouse'

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

  const session = await getSession()
  if (!session?.userId) {
    return { ok: false as const, error: 'Для добавления в корзину нужно войти' }
  }
  const userId = parseInt(session.userId, 10)
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

  const session = await getSession()
  if (!session?.userId) {
    return { ok: false as const, error: 'Unauthorized' }
  }
  const userId = parseInt(session.userId, 10)
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

  const session = await getSession()
  if (!session?.userId) return { ok: true as const }
  const userId = parseInt(session.userId, 10)
  const cart = await prisma.shopCart.findUnique({ where: { userId }, select: { id: true } })
  if (!cart) return { ok: true as const }

  await prisma.shopCartItem.deleteMany({ where: { cartId: cart.id } })
  revalidatePath('/cart')
  return { ok: true as const }
}

export async function mergeGuestCart(lines: { productId: number; quantity: number }[], csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const session = await getSession()
  if (!session?.userId) return { ok: false as const, error: 'Unauthorized' }
  const userId = parseInt(session.userId, 10)

  const normalized = (Array.isArray(lines) ? lines : [])
    .map((l) => ({ productId: Number((l as any)?.productId), quantity: Number((l as any)?.quantity) }))
    .filter((l) => Number.isFinite(l.productId) && l.productId > 0 && Number.isFinite(l.quantity) && l.quantity > 0)
    .map((l) => ({ productId: Math.trunc(l.productId), quantity: clampInt(Math.trunc(l.quantity), 1, 99) }))
    .slice(0, 200)

  if (normalized.length === 0) return { ok: true as const }

  const cartId = await getOrCreateCartId(prisma, userId)

  for (const l of normalized) {
    const product = await prisma.shopProduct.findUnique({
      where: { id: l.productId },
      select: { id: true, isActive: true, stock: true, allowPreorder: true, priceKopeks: true },
    })
    if (!product || !product.isActive) continue

    const existing = await prisma.shopCartItem.findUnique({
      where: { cartId_productId: { cartId, productId: product.id } },
      select: { quantity: true },
    })
    const current = existing?.quantity ?? 0
    const nextWanted = current + l.quantity
    const nextQty = product.allowPreorder ? nextWanted : Math.min(nextWanted, Math.max(0, product.stock))
    if (nextQty <= 0) continue

    await prisma.shopCartItem.upsert({
      where: { cartId_productId: { cartId, productId: product.id } },
      create: { cartId, productId: product.id, quantity: nextQty, unitPriceKopeks: product.priceKopeks },
      update: { quantity: nextQty, unitPriceKopeks: product.priceKopeks },
    })
  }

  revalidatePath('/cart')
  revalidatePath('/checkout')
  return { ok: true as const }
}

export async function createShopOrder(data: {
  shippingMethod: ShippingMethod
  paymentProvider: 'tbank' | 'tbank_link' | 'yookassa' | 'sber_online' | 'tinkoff_online'
  contactName: string
  contactPhone: string
  contactEmail: string
  deliveryPhone?: string
  deliveryCity?: string
  deliveryAddress?: string
  deliveryPostalCode?: string
  comment?: string
  csrfToken: string
}) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(data.csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const PHONE_RE = /^\+7\d{10}$/
  const NAME_RE = /^[A-Za-zА-Яа-яЁё\s\-]{2,50}$/
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  if (!NAME_RE.test((data.contactName || '').trim())) {
    return { ok: false as const, error: 'Имя: только буквы (2–50 символов)' }
  }
  if (!PHONE_RE.test((data.contactPhone || '').trim())) {
    return { ok: false as const, error: 'Телефон: формат +7XXXXXXXXXX' }
  }
  if ((data.contactEmail || '').trim().length > 100 || !EMAIL_RE.test((data.contactEmail || '').trim())) {
    return { ok: false as const, error: 'Email указан неверно (макс. 100 символов)' }
  }
  if ((data.comment || '').length > 200) {
    return { ok: false as const, error: 'Комментарий не более 200 символов' }
  }

  const { userId } = await requireUserId()
  const meta = await getLogMeta()
  const defaultWarehouseId = await getDefaultWarehouseId(prisma)

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

  if (data.shippingMethod !== 'pickup') {
    if (!data.deliveryCity?.trim() || !data.deliveryAddress?.trim() || !data.deliveryPhone?.trim()) {
      return { ok: false as const, error: 'Заполните город, адрес и телефон для доставки' }
    }
    if (!PHONE_RE.test((data.deliveryPhone || '').trim())) {
      return { ok: false as const, error: 'Телефон для доставки: формат +7XXXXXXXXXX' }
    }
  }

  const shippingCarrier =
    data.shippingMethod === 'cdek' ? 'cdek' : data.shippingMethod === 'yandex' ? 'yandex' : data.shippingMethod === 'russian_post' ? 'russian_post' : data.shippingMethod === 'courier_spb' ? 'courier_spb' : data.shippingMethod === 'pickup' ? 'pickup' : null

  const quote =
    (shippingCarrier === 'cdek' || shippingCarrier === 'yandex') && data.deliveryCity && data.deliveryAddress
      ? await quoteShipping({ carrier: shippingCarrier as any, city: data.deliveryCity, address: data.deliveryAddress })
      : null

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.shopOrder.create({
      data: {
        userId,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentProvider: data.paymentProvider,
        shippingMethod: data.shippingMethod,
        shippingCarrier,
        shippingStatus: quote?.ok ? 'quoted' : 'new',
        shippingCostKopeks,
        totalKopeks,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        deliveryPhone: data.deliveryPhone || null,
        deliveryCity: data.deliveryCity || null,
        deliveryAddress: data.deliveryAddress || null,
        deliveryPostalCode: data.deliveryPostalCode || null,
        comment: data.comment || null,
        shippingQuoteMinKopeks: quote?.ok ? quote.minKopeks : null,
        shippingQuoteMaxKopeks: quote?.ok ? quote.maxKopeks : null,
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
        where: { productId_warehouseId: { productId: i.productId, warehouseId: defaultWarehouseId } },
        create: { productId: i.productId, warehouseId: defaultWarehouseId, unit: 'pcs', quantity: 0, reserved: 0, minThreshold: 0 },
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
          warehouseId: defaultWarehouseId,
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
  
  // Detailed list of products
  const itemsList = items.map(i => `- ${i.productName} (${i.quantity} шт.)`).join('\n');

  sendTelegramMessage(
    `<b>🛒 ПРОДАЖА ИЗ МАГАЗИНА</b> #${order.orderNo}\n\n` +
      `💰 Сумма: <b>${(totalKopeks / 100).toFixed(2)} ₽</b>\n` +
      `🚚 Доставка: ${getShippingMethodLabel(data.shippingMethod)}\n` +
      `👤 Контакт: ${data.contactName} ${data.contactPhone}\n` +
      `${data.deliveryCity ? `🏙 Город: ${data.deliveryCity}\n` : ''}` +
      `${data.deliveryAddress ? `📍 Адрес: ${data.deliveryAddress}\n` : ''}\n` +
      `<b>📦 Состав заказа:</b>\n${itemsList}\n\n` +
      `<a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/shop/orders">Открыть в админ-панели</a>`
  ).catch(() => {})
  {
    const from = process.env.SENDGRID_FROM_EMAIL || ''
    if (from && data.contactEmail) {
      sendEmailViaSendGrid({
        to: [data.contactEmail],
        from,
        subject: `Reality3D: заказ #${order.orderNo} создан`,
        text:
          `Заказ #${order.orderNo} создан.\n\n` +
          `Сумма: ${(totalKopeks / 100).toFixed(2)} ₽\n` +
          `Доставка: ${getShippingMethodLabel(data.shippingMethod)}\n` +
          `${data.deliveryCity ? `Город: ${data.deliveryCity}\n` : ''}` +
          `${data.deliveryAddress ? `Адрес: ${data.deliveryAddress}\n` : ''}` +
          `\nСтраница заказа: ${process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/shop/order/${order.id}` : ''}\n`,
      }).catch(() => {})
    }
  }
  return { ok: true as const, orderId: order.id, orderNo: order.orderNo }
}

export async function createGuestShopOrder(data: {
  items: { productId: number; quantity: number }[]
  shippingMethod: ShippingMethod
  paymentProvider: 'tbank' | 'tbank_link' | 'yookassa' | 'sber_online' | 'tinkoff_online'
  contactName: string
  contactPhone: string
  contactEmail: string
  deliveryPhone?: string
  deliveryCity?: string
  deliveryAddress?: string
  deliveryPostalCode?: string
  comment?: string
  csrfToken: string
}) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(data.csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const PHONE_RE = /^\+7\d{10}$/
  const NAME_RE = /^[A-Za-zА-Яа-яЁё\s\-]{2,50}$/
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  if (!NAME_RE.test((data.contactName || '').trim())) return { ok: false as const, error: 'Имя: только буквы (2–50 символов)' }
  if (!PHONE_RE.test((data.contactPhone || '').trim())) return { ok: false as const, error: 'Телефон: формат +7XXXXXXXXXX' }
  if ((data.contactEmail || '').trim().length > 100 || !EMAIL_RE.test((data.contactEmail || '').trim())) {
    return { ok: false as const, error: 'Email указан неверно (макс. 100 символов)' }
  }
  if ((data.comment || '').length > 200) return { ok: false as const, error: 'Комментарий не более 200 символов' }

  const ip = await getClientIp()
  const rl = rateLimit(`shop:guest_checkout:${ip}`, 10, 10 * 60_000)
  if (!rl.ok) return { ok: false as const, error: 'Слишком много попыток. Подожди и попробуй снова.' }

  const meta = await getLogMeta()
  const defaultWarehouseId = await getDefaultWarehouseId(prisma)
  const ua = await getUserAgent()

  const rawItems = Array.isArray(data.items) ? data.items : []
  const lines = rawItems
    .map((l) => ({ productId: Number((l as any)?.productId), quantity: Number((l as any)?.quantity) }))
    .filter((l) => Number.isFinite(l.productId) && l.productId > 0 && Number.isFinite(l.quantity) && l.quantity > 0)
    .map((l) => ({ productId: Math.trunc(l.productId), quantity: clampInt(Math.trunc(l.quantity), 1, 99) }))
    .slice(0, 200)

  if (lines.length === 0) return { ok: false as const, error: 'Корзина пуста' }

  const products = await prisma.shopProduct.findMany({
    where: { id: { in: lines.map((l) => l.productId) }, isActive: true },
    select: { id: true, name: true, sku: true, priceKopeks: true, stock: true, allowPreorder: true },
  })
  const byId = new Map(products.map((p) => [p.id, p]))

  const items = lines
    .map((l) => {
      const p = byId.get(l.productId)
      if (!p) return null
      const unit = p.priceKopeks
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantity: l.quantity,
        unitPriceKopeks: unit,
        totalKopeks: unit * l.quantity,
        allowPreorder: p.allowPreorder,
        freeStock: p.stock,
      }
    })
    .filter(Boolean) as {
    productId: number
    productName: string
    sku: string | null
    quantity: number
    unitPriceKopeks: number
    totalKopeks: number
    allowPreorder: boolean
    freeStock: number
  }[]

  if (items.length === 0) return { ok: false as const, error: 'Товары недоступны' }
  for (const i of items) {
    if (!i.allowPreorder && (i.freeStock <= 0 || i.quantity > i.freeStock)) {
      return { ok: false as const, error: `Недостаточно товара. Доступно ${Math.max(0, i.freeStock)} шт.` }
    }
  }

  const shippingCostKopeks = calcShippingCostKopeks(data.shippingMethod)
  const subtotal = items.reduce((sum, i) => sum + i.totalKopeks, 0)
  const totalKopeks = subtotal + shippingCostKopeks

  if (data.shippingMethod !== 'pickup') {
    if (!data.deliveryCity?.trim() || !data.deliveryAddress?.trim() || !data.deliveryPhone?.trim()) {
      return { ok: false as const, error: 'Заполните город, адрес и телефон для доставки' }
    }
    if (!PHONE_RE.test((data.deliveryPhone || '').trim())) {
      return { ok: false as const, error: 'Телефон для доставки: формат +7XXXXXXXXXX' }
    }
  }

  const shippingCarrier =
    data.shippingMethod === 'cdek' ? 'cdek' : data.shippingMethod === 'yandex' ? 'yandex' : data.shippingMethod === 'russian_post' ? 'russian_post' : data.shippingMethod === 'courier_spb' ? 'courier_spb' : data.shippingMethod === 'pickup' ? 'pickup' : null

  const quote =
    (shippingCarrier === 'cdek' || shippingCarrier === 'yandex') && data.deliveryCity && data.deliveryAddress
      ? await quoteShipping({ carrier: shippingCarrier as any, city: data.deliveryCity, address: data.deliveryAddress })
      : null

  const publicAccessToken = crypto.randomBytes(16).toString('hex')

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.shopOrder.create({
      data: {
        userId: null,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentProvider: data.paymentProvider,
        shippingMethod: data.shippingMethod,
        shippingCarrier,
        shippingStatus: quote?.ok ? 'quoted' : 'new',
        shippingCostKopeks,
        totalKopeks,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        deliveryPhone: data.deliveryPhone || null,
        deliveryCity: data.deliveryCity || null,
        deliveryAddress: data.deliveryAddress || null,
        deliveryPostalCode: data.deliveryPostalCode || null,
        comment: data.comment || null,
        publicAccessToken,
        shippingQuoteMinKopeks: quote?.ok ? quote.minKopeks : null,
        shippingQuoteMaxKopeks: quote?.ok ? quote.maxKopeks : null,
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
        where: { productId_warehouseId: { productId: i.productId, warehouseId: defaultWarehouseId } },
        create: { productId: i.productId, warehouseId: defaultWarehouseId, unit: 'pcs', quantity: 0, reserved: 0, minThreshold: 0 },
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
          actorUserId: null,
          actorRole: 'guest',
          actionType: 'reserve',
          reason: 'sale',
          productId: i.productId,
          warehouseId: defaultWarehouseId,
          locationId: inv.locationId ?? null,
          sku: i.sku || null,
          productName: i.productName,
          quantityDelta: i.quantity,
          unit: 'pcs',
          shopOrderId: created.id,
          comment: `Резерв по гостевому заказу #${created.orderNo}`,
          ipHash: meta.ipHash,
          userAgent: ua,
        },
      })
    }

    await tx.shopClientLog.create({
      data: {
        userId: null,
        actionType: 'checkout_create',
        shopOrderId: created.id,
        orderStatus: 'pending',
        ipHash: meta.ipHash,
        userAgent: ua,
        message: `Создал гостевой заказ #${created.orderNo}`,
      },
    })

    return created
  }).catch((e) => {
    if (e instanceof Error && e.message === 'OUT_OF_STOCK') return null
    throw e
  })

  if (!order) return { ok: false as const, error: 'Недостаточно товара' }

  await logAudit({
    actorUserId: null,
    action: 'shop.order.create',
    target: String(order.orderNo),
    metadata: { orderId: order.id, totalKopeks, shippingMethod: data.shippingMethod, provider: data.paymentProvider, guest: true, ip },
  })

  revalidatePath('/cart')
  revalidatePath('/checkout')
  sendTelegramMessage(
    `<b>Новый гостевой заказ</b> #${order.orderNo}\n` +
      `Сумма: <b>${(totalKopeks / 100).toFixed(2)} ₽</b>\n` +
      `Доставка: ${getShippingMethodLabel(data.shippingMethod)}\n` +
      `Контакт: ${data.contactName} ${data.contactPhone}\n` +
      `${data.deliveryCity ? `Город: ${data.deliveryCity}\n` : ''}` +
      `${data.deliveryAddress ? `Адрес: ${data.deliveryAddress}\n` : ''}`
  ).catch(() => {})
  {
    const from = process.env.SENDGRID_FROM_EMAIL || ''
    if (from && data.contactEmail) {
      sendEmailViaSendGrid({
        to: [data.contactEmail],
        from,
        subject: `Reality3D: заказ #${order.orderNo} создан`,
        text:
          `Заказ #${order.orderNo} создан.\n\n` +
          `Сумма: ${(totalKopeks / 100).toFixed(2)} ₽\n` +
          `Доставка: ${getShippingMethodLabel(data.shippingMethod)}\n` +
          `${data.deliveryCity ? `Город: ${data.deliveryCity}\n` : ''}` +
          `${data.deliveryAddress ? `Адрес: ${data.deliveryAddress}\n` : ''}` +
          `\nСтраница заказа: ${process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/shop/order/${order.id}?token=${publicAccessToken}` : ''}\n`,
      }).catch(() => {})
    }
  }
  return { ok: true as const, orderId: order.id, orderNo: order.orderNo, publicAccessToken }
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

  return { ok: true as const, paymentUrl: init.json.PaymentURL }
}

export async function startTbankPaymentPublic(orderId: string, publicAccessToken: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return { ok: false as const, error: 'Заказ не найден' }
  if (order.userId) return { ok: false as const, error: 'Недостаточно прав' }
  if (!order.publicAccessToken || order.publicAccessToken !== publicAccessToken) return { ok: false as const, error: 'Недостаточно прав' }

  const terminalKey = process.env.TBANK_TERMINAL_KEY
  const password = process.env.TBANK_PASSWORD
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!terminalKey || !password || !siteUrl) {
    return { ok: false as const, error: 'Оплата ТБанк не настроена' }
  }

  const notificationURL = `${siteUrl.replace(/\/$/, '')}/api/payments/tbank`
  const successURL = `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}?token=${encodeURIComponent(publicAccessToken)}`
  const failURL = `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}?token=${encodeURIComponent(publicAccessToken)}&payment=failed`

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
    actorUserId: null,
    action: 'shop.payment.tbank.init',
    target: String(order.orderNo),
    metadata: { orderId: order.id, paymentId: payment.id, externalPaymentId: payment.externalPaymentId, guest: true },
  })

  return { ok: true as const, paymentUrl: init.json.PaymentURL }
}
