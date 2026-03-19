const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

function toKopeks(rub) {
  return Math.round(Number(rub) * 100)
}

async function getDefaultWarehouseId(prisma) {
  const byCode = await prisma.warehouse.findUnique({ where: { code: 'main' }, select: { id: true } }).catch(() => null)
  if (byCode?.id) return byCode.id
  const first = await prisma.warehouse.findFirst({ orderBy: { id: 'asc' }, select: { id: true } })
  if (first?.id) return first.id
  const created = await prisma.warehouse.create({ data: { code: 'main', name: 'Основной склад', isActive: true }, select: { id: true } })
  return created.id
}

async function ensureCashAccounts(prisma) {
  const defs = [
    { code: 'office_cash', name: 'Касса офиса (наличные)', type: 'cash' },
    { code: 'online', name: 'Онлайн-касса', type: 'online' },
    { code: 'bank', name: 'Банковский счёт', type: 'bank' },
  ]
  for (const d of defs) {
    await prisma.cashAccount.upsert({
      where: { code: d.code },
      create: { code: d.code, name: d.name, type: d.type, currency: 'RUB', isActive: true },
      update: { name: d.name, type: d.type, isActive: true },
    })
  }
}

async function main() {
  const prisma = new PrismaClient()
  const cleanup = process.argv.includes('--cleanup')
  const base = `smoke-${Date.now()}`

  const created = {
    userId: null,
    productId: null,
    orderId: null,
    calcOrderId: null,
    paymentId: null,
    cashEntryId: null,
    logs: [],
  }

  try {
    await ensureCashAccounts(prisma)
    const warehouseId = await getDefaultWarehouseId(prisma)
    const bank = await prisma.cashAccount.findUnique({ where: { code: 'bank' }, select: { id: true } })

    const userEmail = `${base}@example.com`
    const user = await prisma.user.create({
      data: { email: userEmail, password: await bcrypt.hash(base, 10), role: 'user', name: 'SMOKE', phone: '+79990000000' },
      select: { id: true },
    })
    created.userId = user.id

    const product = await prisma.shopProduct.create({
      data: {
        name: `SMOKE Товар ${base}`,
        slug: `smoke-${base}`,
        sku: `SMOKE-${base.toUpperCase()}`,
        priceKopeks: toKopeks(400),
        purchasePriceKopeks: toKopeks(200),
        stock: 0,
        isActive: true,
      },
      select: { id: true, name: true, sku: true, priceKopeks: true, purchasePriceKopeks: true },
    })
    created.productId = product.id

    await prisma.shopInventoryItem.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId } },
      create: { productId: product.id, warehouseId, unit: 'pcs', quantity: 10, reserved: 0, minThreshold: 0, lastPurchaseUnitCostKopeks: product.purchasePriceKopeks },
      update: { unit: 'pcs', quantity: 10, reserved: 0, lastPurchaseUnitCostKopeks: product.purchasePriceKopeks },
    })
    await prisma.shopProduct.update({ where: { id: product.id }, data: { stock: 10 } })

    const order = await prisma.shopOrder.create({
      data: {
        userId: user.id,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentProvider: 'tbank_link',
        shippingMethod: 'pickup',
        shippingCostKopeks: 0,
        totalKopeks: product.priceKopeks,
        contactName: 'SMOKE',
        contactEmail: userEmail,
        contactPhone: '+79990000000',
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              quantity: 1,
              unitPriceKopeks: product.priceKopeks,
              totalKopeks: product.priceKopeks,
            },
          ],
        },
      },
      include: { items: true },
    })
    created.orderId = order.id

    await prisma.$transaction(async (tx) => {
      const inv = await tx.shopInventoryItem.findUnique({ where: { productId_warehouseId: { productId: product.id, warehouseId } } })
      if (!inv) throw new Error('Inventory not found')
      const qty = Number(inv.quantity)
      const reserved = Number(inv.reserved || 0)
      const nextReserved = reserved + 1
      await tx.shopInventoryItem.update({ where: { id: inv.id }, data: { reserved: nextReserved } })
      await tx.shopProduct.update({ where: { id: product.id }, data: { stock: Math.max(0, Math.trunc(qty - nextReserved)) } })
      const log = await tx.shopWarehouseLog.create({
        data: {
          actorUserId: user.id,
          actorRole: 'user',
          actionType: 'reserve',
          reason: 'sale',
          productId: product.id,
          warehouseId,
          sku: product.sku,
          productName: product.name,
          quantityDelta: 1,
          unit: 'pcs',
          shopOrderId: order.id,
          comment: `SMOKE резерв под заказ #${order.orderNo}`,
        },
        select: { id: true },
      })
      created.logs.push(log.id)
    })

    const payment = await prisma.shopPayment.create({
      data: {
        orderId: order.id,
        provider: 'tbank_link',
        status: 'succeeded',
        amountKopeks: order.totalKopeks,
        currency: 'RUB',
        externalPaymentId: `manual-${base}`,
        paymentUrl: process.env.NEXT_PUBLIC_TBANK_SELFEMPLOYED_PAYMENT_URL || null,
      },
      select: { id: true },
    })
    created.paymentId = payment.id

    await prisma.$transaction(async (tx) => {
      await tx.shopOrder.update({ where: { id: order.id }, data: { paymentStatus: 'paid', status: 'paid' } })
      if (bank) {
        const e = await tx.cashEntry.create({
          data: {
            accountId: bank.id,
            direction: 'income',
            entryType: 'order_payment',
            amountKopeks: order.totalKopeks,
            currency: 'RUB',
            description: `SMOKE Оплата заказа #${order.orderNo}`,
            status: 'confirmed',
            shopOrderId: order.id,
            shopPaymentId: payment.id,
          },
          select: { id: true },
        })
        created.cashEntryId = e.id
      }

      const inv = await tx.shopInventoryItem.findUnique({ where: { productId_warehouseId: { productId: product.id, warehouseId } } })
      if (!inv) throw new Error('Inventory not found')
      const currentQty = Number(inv.quantity)
      const currentReserved = Number(inv.reserved || 0)
      const nextQty = Math.max(0, currentQty - 1)
      const nextReserved = Math.max(0, currentReserved - 1)
      await tx.shopInventoryItem.update({ where: { id: inv.id }, data: { quantity: nextQty, reserved: nextReserved } })
      await tx.shopProduct.update({ where: { id: product.id }, data: { stock: Math.max(0, Math.trunc(nextQty - nextReserved)) } })
      const log = await tx.shopWarehouseLog.create({
        data: {
          actorUserId: null,
          actorRole: 'system',
          actionType: 'writeoff',
          reason: 'sale',
          productId: product.id,
          warehouseId,
          sku: product.sku,
          productName: product.name,
          quantityDelta: -1,
          unit: 'pcs',
          unitCostKopeks: product.purchasePriceKopeks,
          totalCostKopeks: product.purchasePriceKopeks,
          shopOrderId: order.id,
          comment: `SMOKE списание по оплате заказа #${order.orderNo}`,
        },
        select: { id: true },
      })
      created.logs.push(log.id)

      await tx.shopOrder.update({ where: { id: order.id }, data: { status: 'shipped', shippingStatus: 'shipped', shippingCarrier: 'manual', shippingTrackingNo: `SMOKE-${base}` } })
    })

    await prisma.$transaction(async (tx) => {
      const inv = await tx.shopInventoryItem.findUnique({ where: { productId_warehouseId: { productId: product.id, warehouseId } } })
      if (!inv) throw new Error('Inventory not found')
      const currentQty = Number(inv.quantity)
      const nextQty = currentQty + 5
      await tx.shopInventoryItem.update({ where: { id: inv.id }, data: { quantity: nextQty, lastPurchaseUnitCostKopeks: product.purchasePriceKopeks } })
      const reserved = Number(inv.reserved || 0)
      await tx.shopProduct.update({ where: { id: product.id }, data: { stock: Math.max(0, Math.trunc(nextQty - reserved)) } })
      const log = await tx.shopWarehouseLog.create({
        data: {
          actorUserId: null,
          actorRole: 'system',
          actionType: 'receipt',
          reason: 'purchase',
          productId: product.id,
          warehouseId,
          sku: product.sku,
          productName: product.name,
          quantityDelta: 5,
          unit: 'pcs',
          unitCostKopeks: product.purchasePriceKopeks,
          totalCostKopeks: product.purchasePriceKopeks * 5,
          comment: `SMOKE приход`,
        },
        select: { id: true },
      })
      created.logs.push(log.id)
    })

    const calcOrder = await prisma.order.create({
      data: {
        userId: user.id,
        title: `SMOKE заказ из калькулятора ${base}`,
        status: 'pending',
        price: 0,
        details: JSON.stringify({ smoke: true, base }, null, 2),
      },
      select: { id: true },
    })
    created.calcOrderId = calcOrder.id

    console.log(JSON.stringify({ ok: true, ...created, warehouseId }))
  } finally {
    if (cleanup) {
      await prisma.$transaction(async (tx) => {
        if (created.cashEntryId) await tx.cashEntry.deleteMany({ where: { id: created.cashEntryId } })
        if (created.logs.length) await tx.shopWarehouseLog.deleteMany({ where: { id: { in: created.logs } } })
        if (created.paymentId) await tx.shopPayment.deleteMany({ where: { id: created.paymentId } })
        if (created.orderId) {
          await tx.shopOrderItem.deleteMany({ where: { orderId: created.orderId } })
          await tx.shopClientLog.deleteMany({ where: { shopOrderId: created.orderId } })
          await tx.shopOrder.deleteMany({ where: { id: created.orderId } })
        }
        if (created.productId) {
          await tx.shopInventoryItem.deleteMany({ where: { productId: created.productId } })
          await tx.shopProduct.deleteMany({ where: { id: created.productId } })
        }
        if (created.calcOrderId) await tx.order.deleteMany({ where: { id: created.calcOrderId } })
        if (created.userId) await tx.user.deleteMany({ where: { id: created.userId } })
      })
    }
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

