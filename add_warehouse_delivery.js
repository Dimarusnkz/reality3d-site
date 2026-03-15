const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('P@55wordDP!', 10);

  const users = [
    {
      email: 'warehouse@reality3d.ru',
      name: 'Склад',
      role: 'warehouse',
      password: password,
    },
    {
      email: 'delivery@reality3d.ru',
      name: 'Доставка',
      role: 'delivery',
      password: password,
    },
  ];

  for (const user of users) {
    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        password: user.password,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        password: user.password,
      },
    });
    console.log(`Created/Updated user: ${upsertedUser.email} (${upsertedUser.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
