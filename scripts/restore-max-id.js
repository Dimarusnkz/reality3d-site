const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chatId = '25603555';
  const name = 'Admin (Restored)';

  console.log(`Restoring MAX Chat ID: ${chatId}...`);

  const subscriber = await prisma.maxSubscriber.upsert({
    where: { chatId },
    update: { name },
    create: { chatId, name }
  });

  console.log('SUCCESS: MAX Chat ID restored:', subscriber);
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
