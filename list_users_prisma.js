const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, name: true }
  });
  console.table(users);
}
main().finally(() => prisma.$disconnect());
