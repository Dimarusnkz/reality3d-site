const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
      {
        email: 'client@reality3d.ru',
        name: 'Тестовый Клиент',
        role: 'user',
      },
      {
        email: 'engineer@reality3d.ru',
        name: 'Тестовый Инженер',
        role: 'engineer',
      },
      {
        email: 'manager@reality3d.ru',
        name: 'Тестовый Менеджер',
        role: 'manager',
      },
    ];

    console.log('Creating test users...');

    for (const u of users) {
      // Check if user exists
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (existing) {
        console.log(`User ${u.email} already exists. Updating...`);
        await prisma.user.update({
          where: { email: u.email },
          data: {
            name: u.name,
            role: u.role,
            password: hashedPassword, // Reset password to known value
          },
        });
      } else {
        await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            password: hashedPassword,
            role: u.role,
          },
        });
        console.log(`Created user: ${u.email} (${u.role})`);
      }
    }

    console.log('Test users created successfully.');
  } catch (e) {
    console.error('Error creating users:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
