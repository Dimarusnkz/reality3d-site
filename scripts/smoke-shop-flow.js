const { PrismaClient } = require('@prisma/client')

function toKopeks(rub) {
  return Math.round(Number(rub) * 100)
}

async function main() {
  const prisma = new PrismaClient()
  try {
    const accounts = await prisma.cashAccount.findMany({ select: { id: true, code: true } })
    const online = accounts.find((a) => a.code === 'online')
    if (!online) throw new Error('CashAccount online not found')

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
        where: { productId: prod.id },
        create: {
          productId: prod.id,
          unit: 'pcs',
          quantity: p.qty,
          minThreshold: 0,
          lastPurchaseUnitCostKopeks: prod.purchasePriceKopeks,
        },
        update: {
          unit: 'pcs',
          quantity: p.qty,
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
        const inv = await tx.shopInventoryItem.findUnique({ where: { productId: item.productId } })
        const currentQty = inv ? Number(inv.quantity) : 0
        const nextQty = Math.max(0, currentQty - item.quantity)
        await tx.shopInventoryItem.update({ where: { productId: item.productId }, data: { quantity: nextQty } })
        await tx.shopProduct.update({ where: { id: item.productId }, data: { stock: nextQty } })
        const unitCostKopeks = inv?.lastPurchaseUnitCostKopeks ?? null
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

