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

await prisma.warehouse.upsert({
  where: { code: 'main' },
  create: { code: 'main', name: 'Основной склад', isActive: true },
  update: { name: 'Основной склад', isActive: true },
})

const cashAccounts = [
  { code: 'office_cash', name: 'Касса офиса (наличные)', type: 'cash' },
  { code: 'online', name: 'Онлайн-касса', type: 'online' },
  { code: 'bank', name: 'Банковский счёт', type: 'bank' },
]

for (const a of cashAccounts) {
  await prisma.cashAccount.upsert({
    where: { code: a.code },
    create: { code: a.code, name: a.name, type: a.type, currency: 'RUB', isActive: true },
    update: { name: a.name, type: a.type, isActive: true },
  })
}

const permissions = [
  'warehouse.view',
  'warehouse.receipt',
  'warehouse.writeoff',
  'warehouse.transfer',
  'warehouse.threshold.edit',
  'warehouse.locations.manage',
  'warehouse.recipes.manage',
  'warehouse.production',
  'warehouse.inventory',
  'logs.view',
  'logs.export',
  'shop.orders.manage',
  'shop.orders.export',
  'finance.view',
  'finance.entry.create',
  'finance.reconcile.create',
  'products.purchase_price.view',
  'products.purchase_price.edit',
  'roles.manage',
]

for (const key of permissions) {
  await prisma.permission.upsert({ where: { key }, create: { key }, update: {} })
}

const rolePerms = [
  { role: 'manager', keys: ['warehouse.view', 'warehouse.receipt', 'warehouse.writeoff', 'warehouse.transfer', 'logs.view', 'shop.orders.manage', 'shop.orders.export', 'finance.view', 'finance.entry.create', 'finance.reconcile.create', 'products.purchase_price.view', 'products.purchase_price.edit'] },
  { role: 'warehouse', keys: ['warehouse.view', 'warehouse.receipt', 'warehouse.writeoff', 'warehouse.transfer', 'warehouse.threshold.edit', 'warehouse.locations.manage', 'logs.view'] },
  { role: 'accountant', keys: ['finance.view', 'finance.entry.create', 'finance.reconcile.create', 'logs.view', 'logs.export'] },
  { role: 'delivery', keys: ['shop.orders.manage', 'warehouse.view', 'logs.view'] },
  { role: 'engineer', keys: ['warehouse.view', 'warehouse.production', 'warehouse.inventory', 'logs.view'] },
]

for (const r of rolePerms) {
  for (const key of r.keys) {
    await prisma.rolePermission.upsert({
      where: { roleName_permissionKey: { roleName: r.role, permissionKey: key } },
      create: { roleName: r.role, permissionKey: key },
      update: {},
    })
  }
}

await prisma.$disconnect()

