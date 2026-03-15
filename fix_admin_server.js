const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@reality3d.ru';
  const newPassword = 'R3D@2026!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log(`Checking user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log(`SUCCESS: Password updated for admin: ${email}`);
    console.log(`New password set to: ${newPassword}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
      },
    });
    console.log(`SUCCESS: Created new admin user: ${email}`);
    console.log(`Password set to: ${newPassword}`);
  }
}

main()
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
