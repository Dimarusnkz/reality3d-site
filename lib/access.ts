import { getPrisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export type PermissionKey =
  // Warehouse & Inventory
  | 'warehouse.view'
  | 'warehouse.receipt'
  | 'warehouse.writeoff'
  | 'warehouse.transfer'
  | 'warehouse.threshold.edit'
  | 'warehouse.locations.manage'
  | 'warehouse.recipes.manage'
  | 'warehouse.production'
  | 'warehouse.inventory'
  | 'warehouse.purchase.view'
  | 'warehouse.purchase.manage'
  | 'warehouse.adjustment'
  
  // Shop & Orders
  | 'shop.orders.manage'
  | 'shop.orders.view'
  | 'shop.orders.edit'
  | 'shop.orders.delete'
  | 'shop.orders.export'
  | 'shop.products.manage'
  | 'shop.categories.manage'
  
  // Service Orders (3D Printing)
  | 'orders.view'
  | 'orders.edit'
  | 'orders.assign'
  | 'orders.delete'
  | 'orders.chat.view'
  | 'orders.chat.write'
  
  // Finance
  | 'finance.view'
  | 'finance.entry.create'
  | 'finance.reconcile.create'
  | 'finance.reports.view'
  
  // Products Pricing
  | 'products.purchase_price.view'
  | 'products.purchase_price.edit'
  
  // Content Management
  | 'blog.manage'
  | 'portfolio.manage'
  | 'reviews.manage'
  
  // User & Access Management
  | 'users.view'
  | 'users.edit'
  | 'roles.manage'
  | 'logs.view'
  | 'logs.export'

export async function getUserAccessContext() {
  const session = await getSession()
  if (!session?.userId) return null
  return { userId: parseInt(session.userId, 10), role: session.role }
}

export async function hasPermission(userId: number, role: string, permissionKey: PermissionKey) {
  const prisma = getPrisma()
  if (role === 'admin') return true

  const override = await prisma.userAccessPermission.findUnique({
    where: { userId_permissionKey: { userId, permissionKey } },
    select: { allow: true },
  })
  if (override) return override.allow

  const [byRole, byGroup] = await Promise.all([
    prisma.rolePermission.findUnique({
      where: { roleName_permissionKey: { roleName: role, permissionKey } },
      select: { id: true },
    }),
    prisma.userAccessGroup.findFirst({
      where: { userId, group: { permissions: { some: { permissionKey } } } },
      select: { id: true },
    }),
  ])

  return Boolean(byRole || byGroup)
}

export async function requirePermission(permissionKey: PermissionKey) {
  const ctx = await getUserAccessContext()
  if (!ctx) return { ok: false as const, error: 'Unauthorized' }
  const ok = await hasPermission(ctx.userId, ctx.role, permissionKey)
  if (!ok) return { ok: false as const, error: 'Unauthorized' }
  return { ok: true as const, ...ctx }
}
