const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete all users
    console.log('Deleting all users...');
    await prisma.user.deleteMany({});
    console.log('All users deleted.');

    // Create admin user
    const email = 'admin@reality3d.ru';
    const password = 'P@55wordDP!';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating admin user...');
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
      },
    });

    console.log(`Admin user created: ${user.email} (Role: ${user.role})`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
