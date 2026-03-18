import { getPrisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export type PermissionKey =
  | 'warehouse.view'
  | 'warehouse.receipt'
  | 'warehouse.writeoff'
  | 'warehouse.transfer'
  | 'warehouse.threshold.edit'
  | 'warehouse.locations.manage'
  | 'warehouse.recipes.manage'
  | 'warehouse.production'
  | 'warehouse.inventory'
  | 'logs.view'
  | 'logs.export'
  | 'shop.orders.manage'
  | 'shop.orders.export'
  | 'finance.view'
  | 'finance.entry.create'
  | 'finance.reconcile.create'
  | 'products.purchase_price.view'
  | 'products.purchase_price.edit'
  | 'roles.manage'

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
