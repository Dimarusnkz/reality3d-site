const { PrismaClient } = require('@prisma/client')

function toKopeks(rub) {
  return Math.round(Number(rub) * 100)
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const online =
      (await prisma.cashAccount.findUnique({ where: { code: 'online' }, select: { id: true, code: true } })) ||
      (await prisma.cashAccount.create({ data: { code: 'online', name: 'Онлайн-касса', type: 'online', currency: 'RUB', isActive: true }, select: { id: true, code: true } }))

    const warehouse =
      (await prisma.warehouse.findUnique({ where: { code: 'main' }, select: { id: true } }).catch(() => null)) ||
      (await prisma.warehouse.findFirst({ orderBy: { id: 'asc' }, select: { id: true } })) ||
      (await prisma.warehouse.create({ data: { code: 'main', name: 'Основной склад', isActive: true }, select: { id: true } }))

    const warehouseId = warehouse.id

    const base = `test-${Date.now()}`
    const products = [
      {
        name: `TEST Филамент PLA ${base}`,
        slug: `test-pla-${base}`,
        sku: `TEST-PLA-${base.toUpperCase()}`,
        priceRub: 900,
        purchasePriceRub: 640,
        qty: 10,
      },
      {
        name: `TEST Сопло 0.4 ${base}`,
        slug: `test-nozzle-${base}`,
        sku: `TEST-NOZZLE-${base.toUpperCase()}`,
        priceRub: 500,
        purchasePriceRub: 200,
        qty: 5,
      },
    ]

    const created = []
    for (const p of products) {
      const prod = await prisma.shopProduct.create({
        data: {
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          priceKopeks: toKopeks(p.priceRub),
          purchasePriceKopeks: toKopeks(p.purchasePriceRub),
          stock: p.qty,
          isActive: true,
        },
        select: { id: true, name: true, sku: true, priceKopeks: true, purchasePriceKopeks: true },
      })
      await prisma.shopInventoryItem.upsert({
        where: { productId_warehouseId: { productId: prod.id, warehouseId } },
        create: {
          productId: prod.id,
          warehouseId,
          unit: 'pcs',
          quantity: p.qty,
          reserved: 0,
          minThreshold: 0,
          lastPurchaseUnitCostKopeks: prod.purchasePriceKopeks,
        },
        update: {
          unit: 'pcs',
          quantity: p.qty,
          reserved: 0,
          lastPurchaseUnitCostKopeks: prod.purchasePriceKopeks,
        },
      })
      created.push({ ...p, id: prod.id })
    }

    const order = await prisma.shopOrder.create({
      data: {
        status: 'paid',
        paymentStatus: 'paid',
        paymentProvider: 'tbank',
        shippingMethod: 'pickup',
        shippingCostKopeks: 0,
        totalKopeks: created.reduce((sum, p) => sum + toKopeks(p.priceRub) * 1, 0),
        contactName: 'TEST',
        contactEmail: 'test@reality3d.ru',
        items: {
          create: created.map((p) => ({
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            quantity: 1,
            unitPriceKopeks: toKopeks(p.priceRub),
            totalKopeks: toKopeks(p.priceRub),
          })),
        },
      },
      include: { items: true },
    })

    const payment = await prisma.shopPayment.create({
      data: {
        orderId: order.id,
        provider: 'tbank',
        status: 'succeeded',
        amountKopeks: order.totalKopeks,
        currency: 'RUB',
        externalPaymentId: `test-${base}`,
      },
    })

    await prisma.cashEntry.create({
      data: {
        accountId: online.id,
        direction: 'income',
        entryType: 'order_payment',
        amountKopeks: order.totalKopeks,
        currency: 'RUB',
        description: `TEST Оплата заказа #${order.orderNo}`,
        status: 'confirmed',
        shopOrderId: order.id,
        shopPaymentId: payment.id,
      },
    })

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.productId) continue
        const inv = await tx.shopInventoryItem.findUnique({ where: { productId_warehouseId: { productId: item.productId, warehouseId } } })
        if (!inv) throw new Error('Inventory not found')
        const currentQty = Number(inv.quantity)
        const nextQty = Math.max(0, currentQty - item.quantity)
        const nextReserved = Math.max(0, Number(inv.reserved || 0) - item.quantity)
        await tx.shopInventoryItem.update({ where: { id: inv.id }, data: { quantity: nextQty, reserved: nextReserved } })
        await tx.shopProduct.update({ where: { id: item.productId }, data: { stock: Math.max(0, Math.trunc(nextQty - nextReserved)) } })
        const unitCostKopeks = inv?.lastPurchaseUnitCostKopeks ?? null
        const totalCostKopeks = unitCostKopeks == null ? null : unitCostKopeks * item.quantity
        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: null,
            actorRole: 'system',
            actionType: 'writeoff',
            reason: 'sale',
            productId: item.productId,
            warehouseId,
            sku: item.sku || null,
            productName: item.productName,
            quantityDelta: -item.quantity,
            unit: 'pcs',
            unitCostKopeks,
            totalCostKopeks,
            shopOrderId: order.id,
            comment: `TEST автосписание по заказу #${order.orderNo}`,
          },
        })
      }
    })

    console.log(JSON.stringify({ ok: true, orderId: order.id, orderNo: order.orderNo, products: created.map((p) => ({ id: p.id, slug: p.slug })) }))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
