'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { z } from 'zod'
import { getLogMeta } from '@/lib/shop/log-meta'
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid'
import { logAudit } from '@/lib/audit'

type Unit = 'pcs' | 'm' | 'kg'

const movementSchema = z.object({
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

function requireWarehouseAccess(session: { userId?: string; role?: string } | null) {
  if (!session?.userId) return { ok: false as const, error: 'Unauthorized' }
  if (!session.role || !['admin', 'manager', 'warehouse', 'engineer'].includes(session.role)) {
    return { ok: false as const, error: 'Unauthorized' }
  }
  return { ok: true as const, userId: parseInt(session.userId, 10), role: session.role }
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

  const session = await getSession()
  const access = requireWarehouseAccess(session)
  if (!access.ok) return access

  const parsed = movementSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const qty = parseQuantity(parsed.data.quantity)
  if (!qty) return { ok: false as const, error: 'Некорректное количество' }

  const unit: Unit = parsed.data.unit
  if (unit === 'pcs' && !Number.isInteger(qty)) return { ok: false as const, error: 'Для шт. нужно целое количество' }

  if (parsed.data.actionType !== 'receipt' && qty > 10 && !['admin', 'manager'].includes(access.role)) {
    return { ok: false as const, error: 'Списание > 10 требует подтверждения менеджера' }
  }

  const product = await prisma.shopProduct.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, name: true, sku: true },
  })
  if (!product) return { ok: false as const, error: 'Товар не найден' }

  const delta = parsed.data.actionType === 'receipt' ? qty : -qty

  const meta = await getLogMeta()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.shopInventoryItem.upsert({
        where: { productId: product.id },
        create: { productId: product.id, unit, quantity: 0, minThreshold: 0 },
        update: {},
      })

      if (item.unit !== unit) {
        return { ok: false as const, error: `Единица товара на складе: ${item.unit}. Нельзя провести операцию в ${unit}` }
      }

      const next = Number(item.quantity) + delta
      if (next < 0) return { ok: false as const, error: 'Недостаточно остатка' }

      const updated = await tx.shopInventoryItem.update({
        where: { id: item.id },
        data: { quantity: next },
      })

      if (unit === 'pcs') {
        await tx.shopProduct.update({
          where: { id: product.id },
          data: { stock: Math.max(0, Math.trunc(next)) },
        })
      }

      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: access.userId,
          actorRole: access.role,
          actionType: parsed.data.actionType,
          reason: parsed.data.reason || null,
          productId: product.id,
          sku: product.sku || null,
          productName: product.name,
          quantityDelta: delta,
          unit,
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
    if (quantity <= minThreshold && minThreshold > 0) {
      await notifyLowStock({
        sku: product.sku || null,
        name: product.name,
        quantity: String(quantity),
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
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: 'Не удалось выполнить операцию' }
  }
}

const inventorySettingsSchema = z.object({
  productId: z.number().int().positive(),
  unit: z.enum(['pcs', 'm', 'kg']),
  minThreshold: z.string().trim().min(0).max(32),
})

export async function updateInventorySettings(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const session = await getSession()
  const access = requireWarehouseAccess(session)
  if (!access.ok) return access

  const parsed = inventorySettingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const min = parseQuantity(parsed.data.minThreshold === '' ? '0' : parsed.data.minThreshold) ?? 0
  const unit: Unit = parsed.data.unit
  if (unit === 'pcs' && !Number.isInteger(min)) return { ok: false as const, error: 'Для шт. порог должен быть целым' }

  const product = await prisma.shopProduct.findUnique({ where: { id: parsed.data.productId }, select: { id: true, sku: true } })
  if (!product) return { ok: false as const, error: 'Товар не найден' }

  const meta = await getLogMeta()

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.shopInventoryItem.upsert({
        where: { productId: product.id },
        create: { productId: product.id, unit, quantity: 0, minThreshold: min },
        update: { unit, minThreshold: min },
      })

      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: access.userId,
          actorRole: access.role,
          actionType: 'threshold_update',
          productId: product.id,
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

