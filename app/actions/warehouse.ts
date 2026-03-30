'use server'

import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { hasPermission, getUserAccessContext } from '@/lib/access'
import { getDefaultWarehouseId } from '@/lib/warehouse/default-warehouse'
import { WarehouseService } from '@/lib/services/warehouse-service'
import { warehouseMovementSchema, inventorySettingsSchema } from '@/lib/schemas/warehouse'

export async function createWarehouseMovement(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }

  const parsed = warehouseMovementSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const permissionKey =
    parsed.data.actionType === 'receipt'
      ? 'warehouse.receipt'
      : parsed.data.actionType === 'writeoff'
        ? 'warehouse.writeoff'
        : parsed.data.actionType === 'adjustment'
          ? 'warehouse.adjustment'
          : 'warehouse.transfer'

  const permitted = await hasPermission(access.userId, access.role, permissionKey)
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }

  const defaultWarehouseId = await getDefaultWarehouseId(prisma)
  const warehouseService = new WarehouseService(prisma)

  try {
    await warehouseService.createMovement(parsed.data, access.userId, access.role, defaultWarehouseId)
    return { ok: true as const }
  } catch (error: any) {
    return { ok: false as const, error: error.message || 'Не удалось выполнить операцию' }
  }
}

export async function updateInventorySettings(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }
  const permitted = await hasPermission(access.userId, access.role, 'warehouse.threshold.edit')
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }

  const parsed = inventorySettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const defaultWarehouseId = await getDefaultWarehouseId(prisma)
  const warehouseService = new WarehouseService(prisma)

  try {
    await warehouseService.updateSettings(parsed.data, access.userId, access.role, defaultWarehouseId)
    return { ok: true as const }
  } catch (error: any) {
    return { ok: false as const, error: error.message || 'Не удалось сохранить настройки' }
  }
}
