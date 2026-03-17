const { PrismaClient } = require('@prisma/client')

async function main() {
  const name = process.argv.slice(2).join(' ').trim()
  if (!name) {
    console.error('Usage: node scripts/cleanup-product.js <product name substring>')
    process.exit(2)
  }

  const prisma = new PrismaClient()
  try {
    const product = await prisma.shopProduct.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true },
    })
    if (!product) {
      console.log(JSON.stringify({ ok: true, found: false }))
      return
    }

    const [orderItems, warehouseLogs, clientLogs] = await Promise.all([
      prisma.shopOrderItem.count({ where: { productId: product.id } }),
      prisma.shopWarehouseLog.count({ where: { productId: product.id } }),
      prisma.shopClientLog.count({ where: { productId: product.id } }),
    ])

    await prisma.shopCartItem.deleteMany({ where: { productId: product.id } })
    await prisma.shopWishlistItem.deleteMany({ where: { productId: product.id } })
    await prisma.shopProductImage.deleteMany({ where: { productId: product.id } })

    if (orderItems > 0 || warehouseLogs > 0 || clientLogs > 0) {
      const suffix = Date.now()
      await prisma.shopInventoryItem.updateMany({ where: { productId: product.id }, data: { quantity: 0 } })
      await prisma.shopProduct.update({
        where: { id: product.id },
        data: {
          isActive: false,
          stock: 0,
          slug: `${product.slug}--archived-${suffix}`,
          name: `${product.name} (архив)`,
        },
      })
      console.log(JSON.stringify({ ok: true, action: 'archived', id: product.id }))
      return
    }

    await prisma.shopInventoryItem.deleteMany({ where: { productId: product.id } })
    await prisma.shopWarehouseLog.deleteMany({ where: { productId: product.id } })
    await prisma.shopClientLog.deleteMany({ where: { productId: product.id } })
    await prisma.shopProduct.delete({ where: { id: product.id } })
    console.log(JSON.stringify({ ok: true, action: 'deleted', id: product.id }))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

