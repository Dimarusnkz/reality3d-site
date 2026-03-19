'use server'

import { revalidatePath } from 'next/cache'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { z } from 'zod'
import { getLogMeta } from '@/lib/shop/log-meta'
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid'
import { logAudit } from '@/lib/audit'
import { hasPermission, getUserAccessContext } from '@/lib/access'
import { getDefaultWarehouseId } from '@/lib/warehouse/default-warehouse'

type Unit = 'pcs' | 'm' | 'kg'

const movementSchema = z.object({
  warehouseId: z.number().int().positive().optional().nullable(),
  productId: z.number().int().positive(),
  unit: z.enum(['pcs', 'm', 'kg']),
  quantity: z.string().trim().min(1),
  actionType: z.enum(['receipt', 'writeoff', 'transfer_to_work']),
  reason: z.enum(['sale', 'defect', 'internal', 'to_work']).optional().nullable(),
  supplier: z.string().trim().max(200).optional().nullable(),
  documentNo: z.string().trim().max(120).optional().nullable(),
  comment: z.string().trim().max(500).optional().nullable(),
  shopOrderId: z.string().trim().uuid().optional().nullable(),
  serviceOrderId: z.number().int().positive().optional().nullable(),
})

function parseQuantity(input: string) {
  const normalized = input.replace(',', '.')
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

async function notifyLowStock(input: {
  sku: string | null
  name: string
  quantity: string
  minThreshold: string
  unit: string
}) {
  const toRaw = process.env.WAREHOUSE_LOW_STOCK_EMAILS || ''
  const to = toRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const from = process.env.SENDGRID_FROM_EMAIL || ''
  if (to.length === 0 || !from) return

  await sendEmailViaSendGrid({
    to,
    from,
    subject: `Reality3D: низкий остаток — ${input.sku ? `${input.sku} ` : ''}${input.name}`,
    text: `Низкий остаток на складе.\n\nТовар: ${input.sku ? `${input.sku} — ` : ''}${input.name}\nОстаток: ${input.quantity} ${input.unit}\nМин. порог: ${input.minThreshold} ${input.unit}\n`,
  })
}

export async function createWarehouseMovement(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }

  const parsed = movementSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const permissionKey =
    parsed.data.actionType === 'receipt'
      ? 'warehouse.receipt'
      : parsed.data.actionType === 'writeoff'
        ? 'warehouse.writeoff'
        : 'warehouse.transfer'

  const permitted = await hasPermission(access.userId, access.role, permissionKey)
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }

  const defaultWarehouseId = await getDefaultWarehouseId(prisma)
  const qty = parseQuantity(parsed.data.quantity)
  if (!qty) return { ok: false as const, error: 'Некорректное количество' }

  const unit: Unit = parsed.data.unit
  const warehouseId = parsed.data.warehouseId == null ? defaultWarehouseId : parsed.data.warehouseId
  if (unit === 'pcs' && !Number.isInteger(qty)) return { ok: false as const, error: 'Для шт. нужно целое количество' }

  if (parsed.data.actionType !== 'receipt' && qty > 10 && !['admin', 'manager'].includes(access.role)) {
    return { ok: false as const, error: 'Списание > 10 требует подтверждения менеджера' }
  }

  const product = await prisma.shopProduct.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, name: true, sku: true, purchasePriceKopeks: true },
  })
  if (!product) return { ok: false as const, error: 'Товар не найден' }

  const delta = parsed.data.actionType === 'receipt' ? qty : -qty

  const meta = await getLogMeta()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.shopInventoryItem.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId } },
        create: { productId: product.id, warehouseId, unit, quantity: 0, reserved: 0, minThreshold: 0 },
        update: {},
      })

      if (item.unit !== unit) {
        return { ok: false as const, error: `Единица товара на складе: ${item.unit}. Нельзя провести операцию в ${unit}` }
      }

      const currentQty = Number(item.quantity)
      const currentReserved = Number((item as any).reserved ?? 0)
      const next = currentQty + delta
      if (next < 0) return { ok: false as const, error: 'Недостаточно остатка' }
      if (parsed.data.actionType !== 'receipt' && next < currentReserved) {
        return { ok: false as const, error: 'Нельзя списать ниже резерва' }
      }

      const updated = await tx.shopInventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: next,
          ...(parsed.data.actionType === 'receipt' && product.purchasePriceKopeks != null
            ? { lastPurchaseUnitCostKopeks: product.purchasePriceKopeks }
            : {}),
        },
      })

      if (unit === 'pcs') {
        if (warehouseId === defaultWarehouseId) {
          await tx.shopProduct.update({
            where: { id: product.id },
            data: { stock: Math.max(0, Math.trunc(next - currentReserved)) },
          })
        }
      }

      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: access.userId,
          actorRole: access.role,
          actionType: parsed.data.actionType,
          reason: parsed.data.reason || null,
          productId: product.id,
          warehouseId,
          locationId: item.locationId ?? null,
          sku: product.sku || null,
          productName: product.name,
          quantityDelta: delta,
          unit,
          unitCostKopeks: null,
          totalCostKopeks: null,
          shopOrderId: parsed.data.shopOrderId || null,
          serviceOrderId: parsed.data.serviceOrderId || null,
          supplier: parsed.data.supplier || null,
          documentNo: parsed.data.documentNo || null,
          comment: parsed.data.comment || null,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      })

      return { ok: true as const, updated }
    })

    if (!result.ok) return result

    const minThreshold = Number(result.updated.minThreshold)
    const quantity = Number(result.updated.quantity)
    const reserved = Number((result.updated as any).reserved ?? 0)
    const free = quantity - reserved
    if (free <= minThreshold && minThreshold > 0) {
      await notifyLowStock({
        sku: product.sku || null,
        name: product.name,
        quantity: String(Math.max(0, free)),
        minThreshold: String(minThreshold),
        unit,
      })
    }

    await logAudit({
      actorUserId: access.userId,
      action: 'warehouse.movement',
      target: product.sku || String(product.id),
      metadata: { actionType: parsed.data.actionType, delta, unit, reason: parsed.data.reason || null },
    })

    revalidatePath('/admin/warehouse')
    revalidatePath(`/admin/warehouse?w=${warehouseId}`)
    revalidatePath(`/admin/warehouse/operations?w=${warehouseId}`)
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: 'Не удалось выполнить операцию' }
  }
}

const inventorySettingsSchema = z.object({
  warehouseId: z.number().int().positive().optional().nullable(),
  productId: z.number().int().positive(),
  unit: z.enum(['pcs', 'm', 'kg']),
  minThreshold: z.string().trim().min(0).max(32),
})

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
  const min = parseQuantity(parsed.data.minThreshold === '' ? '0' : parsed.data.minThreshold) ?? 0
  const unit: Unit = parsed.data.unit
  const warehouseId = parsed.data.warehouseId == null ? defaultWarehouseId : parsed.data.warehouseId
  if (unit === 'pcs' && !Number.isInteger(min)) return { ok: false as const, error: 'Для шт. порог должен быть целым' }

  const product = await prisma.shopProduct.findUnique({ where: { id: parsed.data.productId }, select: { id: true, sku: true } })
  if (!product) return { ok: false as const, error: 'Товар не найден' }

  const meta = await getLogMeta()

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.shopInventoryItem.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId } },
        create: { productId: product.id, warehouseId, unit, quantity: 0, reserved: 0, minThreshold: min },
        update: { unit, minThreshold: min },
      })

      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: access.userId,
          actorRole: access.role,
          actionType: 'threshold_update',
          productId: product.id,
          warehouseId,
          locationId: item.locationId ?? null,
          sku: product.sku || null,
          quantityDelta: 0,
          unit: item.unit,
          comment: `minThreshold=${min}`,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      })
    })

    revalidatePath('/admin/warehouse')
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось сохранить настройки' }
  }
}
