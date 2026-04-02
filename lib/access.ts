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
  
  // Analytics
  | 'admin.analytics.view'
  
  // Knowledge Base Management
  | 'admin.access'

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  // Склад и Инвентаризация
  'warehouse.view': 'Склад: Просмотр',
  'warehouse.receipt': 'Склад: Приемка товара',
  'warehouse.writeoff': 'Склад: Списание',
  'warehouse.transfer': 'Склад: Перемещение',
  'warehouse.threshold.edit': 'Склад: Изменение порогов остатков',
  'warehouse.locations.manage': 'Склад: Управление локациями',
  'warehouse.recipes.manage': 'Склад: Управление рецептами',
  'warehouse.production': 'Склад: Производство',
  'warehouse.inventory': 'Склад: Инвентаризация',
  'warehouse.purchase.view': 'Склад: Просмотр закупок',
  'warehouse.purchase.manage': 'Склад: Управление закупками',
  'warehouse.adjustment': 'Склад: Корректировка остатков',

  // Магазин и Заказы
  'shop.orders.manage': 'Магазин: Управление заказами',
  'shop.orders.view': 'Магазин: Просмотр заказов',
  'shop.orders.edit': 'Магазин: Редактирование заказов',
  'shop.orders.delete': 'Магазин: Удаление заказов',
  'shop.orders.export': 'Магазин: Экспорт заказов',
  'shop.products.manage': 'Магазин: Управление товарами',
  'shop.categories.manage': 'Магазин: Управление категориями',

  // Заказы на услуги (3D печать)
  'orders.view': 'Услуги: Просмотр заказов',
  'orders.edit': 'Услуги: Редактирование заказов',
  'orders.assign': 'Услуги: Назначение исполнителя',
  'orders.delete': 'Услуги: Удаление заказов',
  'orders.chat.view': 'Услуги: Просмотр чатов',
  'orders.chat.write': 'Услуги: Написание в чат',

  // Финансы
  'finance.view': 'Финансы: Просмотр',
  'finance.entry.create': 'Финансы: Создание записей',
  'finance.reconcile.create': 'Финансы: Создание сверок',
  'finance.reports.view': 'Финансы: Просмотр отчетов',

  // Цены товаров
  'products.purchase_price.view': 'Цены: Просмотр закупочных цен',
  'products.purchase_price.edit': 'Цены: Редактирование закупочных цен',

  // Контент
  'blog.manage': 'Контент: Управление блогом',
  'portfolio.manage': 'Контент: Управление портфолио',
  'reviews.manage': 'Контент: Управление отзывами',

  // Пользователи и Доступ
  'users.view': 'Пользователи: Просмотр',
  'users.edit': 'Пользователи: Редактирование',
  'roles.manage': 'Доступ: Управление ролями',
  'logs.view': 'Система: Просмотр логов',
  'logs.export': 'Система: Экспорт логов',

  // Аналитика
  'admin.analytics.view': 'Аналитика: Просмотр',

  // База знаний
  'admin.access': 'База знаний: Доступ к управлению'
}

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
