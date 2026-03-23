import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING DATABASE CLEANUP ---')

  // 1. Clear Shop related transactions
  console.log('Clearing Shop data...')
  await prisma.shopPayment.deleteMany({})
  await prisma.shopOrderItem.deleteMany({})
  await prisma.shopOrder.deleteMany({})
  await prisma.shopCartItem.deleteMany({})
  await prisma.shopCart.deleteMany({})
  await prisma.shopWishlistItem.deleteMany({})

  // 2. Clear Calc (3D Print) related transactions
  console.log('Clearing Order and Chat data...')
  await prisma.orderComment.deleteMany({})
  await prisma.message.deleteMany({})
  await prisma.chatSession.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.printCalculation.deleteMany({})

  // 3. Clear Inventory and Warehouse
  console.log('Clearing Inventory and Warehouse data...')
  await prisma.warehouseLocationStock.deleteMany({})
  await prisma.shopInventoryItem.deleteMany({})
  await prisma.warehouseProductionConsumeItem.deleteMany({})
  await prisma.warehouseProductionOrder.deleteMany({})
  await prisma.warehouseRecipeItem.deleteMany({})
  await prisma.warehouseRecipe.deleteMany({})
  await prisma.warehouseReceiptItem.deleteMany({})
  await prisma.warehouseTransferItem.deleteMany({})
  await prisma.warehouseInventoryCountItem.deleteMany({})

  // 4. Clear Logs and Sessions
  console.log('Clearing Logs and Sessions...')
  await prisma.shopWarehouseLog.deleteMany({})
  await prisma.shopClientLog.deleteMany({})
  await prisma.auditEvent.deleteMany({})
  await prisma.session.deleteMany({})

  // 5. Clear Other Content
  console.log('Clearing Reviews and Articles...')
  await prisma.review.deleteMany({})
  await prisma.article.deleteMany({})

  // 6. Delete Users (Except Admins)
  console.log('Deleting users except administrators...')
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: {
        not: 'admin'
      }
    }
  })
  console.log(`Deleted ${deletedUsers.count} non-admin users.`)

  // 7. Reset Product Stock (optional but good practice)
  console.log('Resetting ShopProduct stock to 0...')
  await prisma.shopProduct.updateMany({
    data: {
      stock: 0
    }
  })

  console.log('--- CLEANUP FINISHED SUCCESSFULLY ---')
}

main()
  .catch((e) => {
    console.error('ERROR DURING CLEANUP:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
