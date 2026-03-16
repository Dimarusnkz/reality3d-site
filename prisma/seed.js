import bcrypt from 'bcryptjs'

const provider = (process.env.DB_PROVIDER || 'postgres').toLowerCase()

const url =
  provider === 'sqlite'
    ? process.env.DATABASE_URL_SQLITE
    : provider === 'mysql'
      ? process.env.DATABASE_URL_MYSQL
      : process.env.DATABASE_URL

const { PrismaClient } =
  provider === 'sqlite'
    ? await import('../generated/sqlite-client/index.js')
    : provider === 'mysql'
      ? await import('../generated/mysql-client/index.js')
      : await import('@prisma/client')

const prisma = new PrismaClient({ datasources: { db: { url } } })

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required')
  process.exit(1)
}

const hashedPassword = await bcrypt.hash(password, 10)

await prisma.user.upsert({
  where: { email },
  update: { password: hashedPassword, role: 'admin' },
  create: { email, password: hashedPassword, role: 'admin', name: 'Admin' },
})

await prisma.$disconnect()

