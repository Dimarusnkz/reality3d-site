const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DATABASE CLEANUP ---');

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Чат (сообщения и сессии)
      console.log('Cleaning chats...');
      await tx.chatMessage.deleteMany({});
      await tx.chatSession.deleteMany({});

      // 2. Заказы магазина (позиции, платежи, логи и сами заказы)
      console.log('Cleaning shop orders...');
      await tx.shopWarehouseLog.deleteMany({});
      await tx.shopPayment.deleteMany({});
      await tx.shopOrderItem.deleteMany({});
      await tx.shopOrder.deleteMany({});

      // 3. Услуги/Заказы (комментарии и сами заказы)
      console.log('Cleaning service orders...');
      await tx.orderComment.deleteMany({});
      await tx.order.deleteMany({});

      // 4. Финансы (транзакции и сверки)
      console.log('Cleaning finance...');
      await tx.cashEntry.deleteMany({});
      await tx.cashReconciliation.deleteMany({});

      // 5. Логи аудита и системные логи
      console.log('Cleaning logs...');
      await tx.auditLog.deleteMany({});
      await tx.shopClientLog.deleteMany({});

      // 6. Отзывы
      console.log('Cleaning reviews...');
      await tx.review.deleteMany({});

      // 7. Склад (остатки и настройки)
      console.log('Cleaning warehouse stock...');
      await tx.shopInventoryItem.deleteMany({});
      // Товары (shopProduct) пока оставим, чтобы можно было завести остатки, 
      // или удалим если нужно полное "обнуление". 
      // Судя по запросу "заведение первых позиций", лучше очистить и товары.
      await tx.shopProduct.deleteMany({});

      // 8. Клиенты (удаляем всех, кроме сотрудников)
      console.log('Cleaning users (keeping employees)...');
      const deletedUsers = await tx.user.deleteMany({
        where: {
          role: {
            notIn: ['admin', 'manager', 'engineer', 'warehouse', 'delivery']
          }
        }
      });
      console.log(`Deleted ${deletedUsers.count} client accounts.`);

      // 9. Сессии (удаляем все сессии, чтобы всех разлогинило для чистоты)
      console.log('Cleaning sessions...');
      await tx.session.deleteMany({});
    });

    console.log('--- CLEANUP SUCCESSFUL ---');
    console.log('Site is ready for fresh start.');
  } catch (error) {
    console.error('--- CLEANUP FAILED ---');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
