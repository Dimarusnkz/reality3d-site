const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@reality3d.ru'; // Default admin email
  const newPassword = 'R3D@2026!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Check if admin exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log(`Password updated for existing admin: ${email}`);
  } else {
    // Create admin
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
      },
    });
    console.log(`Created new admin user: ${email}`);
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
