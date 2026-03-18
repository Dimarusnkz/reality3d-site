'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { getUserAccessContext, hasPermission } from '@/lib/access'
import { getLogMeta } from '@/lib/shop/log-meta'
import { logAudit } from '@/lib/audit'

function parseDecimal(input: string) {
  const normalized = input.replace(',', '.')
  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  return value
}

async function requireTransferAccess() {
  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }
  const permitted = await hasPermission(access.userId, access.role, 'warehouse.transfer')
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }
  return { ok: true as const, access }
}

const transferCreateSchema = z.object({
  fromWarehouseId: z.number().int().positive(),
  fromLocationId: z.number().int().positive().optional().nullable(),
  toWarehouseId: z.number().int().positive(),
  toLocationId: z.number().int().positive().optional().nullable(),
  comment: z.string().trim().max(500).optional().nullable(),
})

export async function createWarehouseTransfer(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireTransferAccess()
  if (!accessRes.ok) return accessRes

  const parsed = transferCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }
  if (parsed.data.fromWarehouseId === parsed.data.toWarehouseId && (parsed.data.fromLocationId || null) === (parsed.data.toLocationId || null)) {
    return { ok: false as const, error: 'Нельзя перемещать в ту же локацию' }
  }

  try {
    const created = await prisma.warehouseTransfer.create({
      data: {
        fromWarehouseId: parsed.data.fromWarehouseId,
        fromLocationId: parsed.data.fromLocationId ?? null,
        toWarehouseId: parsed.data.toWarehouseId,
        toLocationId: parsed.data.toLocationId ?? null,
        status: 'draft',
        comment: parsed.data.comment || null,
        createdByUserId: accessRes.access.userId,
      },
      select: { id: true },
    })
    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.transfer.create', target: created.id })
    revalidatePath('/admin/warehouse/transfers')
    revalidatePath(`/admin/warehouse/transfers?w=${parsed.data.fromWarehouseId}`)
    return { ok: true as const, id: created.id }
  } catch {
    return { ok: false as const, error: 'Не удалось создать перемещение' }
  }
}

const transferItemSchema = z.object({
  transferId: z.string().uuid(),
  productId: z.number().int().positive(),
  quantity: z.string().trim().min(1).max(32),
  unit: z.enum(['pcs', 'kg', 'm']),
})

export async function addWarehouseTransferItem(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireTransferAccess()
  if (!accessRes.ok) return accessRes

  const parsed = transferItemSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const qty = parseDecimal(parsed.data.quantity)
  if (!qty || qty <= 0) return { ok: false as const, error: 'Некорректное количество' }
  if (parsed.data.unit === 'pcs' && !Number.isInteger(qty)) return { ok: false as const, error: 'Для шт. нужно целое количество' }

  const tr = await prisma.warehouseTransfer.findUnique({ where: { id: parsed.data.transferId }, select: { id: true, status: true, fromWarehouseId: true } })
  if (!tr) return { ok: false as const, error: 'Перемещение не найдено' }
  if (tr.status !== 'draft') return { ok: false as const, error: 'Нельзя менять проведённое перемещение' }

  const product = await prisma.shopProduct.findUnique({ where: { id: parsed.data.productId }, select: { id: true, name: true, sku: true } })
  if (!product) return { ok: false as const, error: 'Товар не найден' }

  try {
    await prisma.warehouseTransferItem.create({
      data: {
        transferId: tr.id,
        productId: product.id,
        sku: product.sku || null,
        productName: product.name,
        quantity: qty,
        unit: parsed.data.unit,
      },
    })
    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.transfer.item.add', target: tr.id })
    revalidatePath(`/admin/warehouse/transfers/${tr.id}`)
    revalidatePath(`/admin/warehouse/transfers/${tr.id}?w=${tr.fromWarehouseId}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось добавить позицию' }
  }
}

export async function deleteWarehouseTransferItem(itemId: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireTransferAccess()
  if (!accessRes.ok) return accessRes

  const item = await prisma.warehouseTransferItem.findUnique({ where: { id: itemId }, select: { id: true, transferId: true, transfer: { select: { status: true, fromWarehouseId: true } } } })
  if (!item) return { ok: true as const }
  if (item.transfer.status !== 'draft') return { ok: false as const, error: 'Нельзя менять проведённое перемещение' }

  try {
    await prisma.warehouseTransferItem.delete({ where: { id: itemId } })
    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.transfer.item.delete', target: itemId })
    revalidatePath(`/admin/warehouse/transfers/${item.transferId}`)
    revalidatePath(`/admin/warehouse/transfers/${item.transferId}?w=${item.transfer.fromWarehouseId}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось удалить позицию' }
  }
}

export async function postWarehouseTransfer(transferId: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireTransferAccess()
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const meta = await getLogMeta()

  try {
    const tr = await prisma.warehouseTransfer.findUnique({
      where: { id: transferId },
      include: {
        fromWarehouse: { select: { id: true, code: true, name: true } },
        toWarehouse: { select: { id: true, code: true, name: true } },
        fromLocation: { select: { id: true, code: true, name: true } },
        toLocation: { select: { id: true, code: true, name: true } },
        items: true,
      },
    })
    if (!tr) return { ok: false as const, error: 'Перемещение не найдено' }
    if (tr.status !== 'draft') return { ok: false as const, error: 'Перемещение уже проведено' }
    if (tr.items.length === 0) return { ok: false as const, error: 'Добавьте позиции' }

    await prisma.$transaction(async (tx) => {
      for (const it of tr.items) {
        const qty = Number(it.quantity)
        if (qty <= 0) continue

        const fromInv = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: it.productId, warehouseId: tr.fromWarehouseId } },
          create: { productId: it.productId, warehouseId: tr.fromWarehouseId, unit: it.unit, quantity: 0, reserved: 0, minThreshold: 0 },
          update: {},
        })
        if (fromInv.unit !== it.unit) throw new Error('UNIT_MISMATCH')

        const fromQty = Number(fromInv.quantity)
        const fromReserved = Number((fromInv as any).reserved ?? 0)
        const fromFree = fromQty - fromReserved
        if (fromFree < qty) throw new Error('OUT_OF_STOCK')

        const nextFromQty = fromQty - qty
        await tx.shopInventoryItem.update({ where: { id: fromInv.id }, data: { quantity: nextFromQty } })
        if (tr.fromWarehouseId === 1 && it.unit === 'pcs') {
          await tx.shopProduct.update({ where: { id: it.productId }, data: { stock: Math.max(0, Math.trunc(nextFromQty - fromReserved)) } })
        }

        if (tr.fromLocationId) {
          const ls = await tx.warehouseLocationStock.upsert({
            where: { warehouseId_locationId_productId: { warehouseId: tr.fromWarehouseId, locationId: tr.fromLocationId, productId: it.productId } },
            create: { warehouseId: tr.fromWarehouseId, locationId: tr.fromLocationId, productId: it.productId, unit: it.unit, quantity: 0 },
            update: {},
          })
          if (ls.unit !== it.unit) throw new Error('UNIT_MISMATCH')
          const locQty = Number(ls.quantity)
          if (locQty < qty) throw new Error('OUT_OF_STOCK_LOCATION')
          await tx.warehouseLocationStock.update({ where: { id: ls.id }, data: { quantity: locQty - qty } })
        }

        const toInv = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: it.productId, warehouseId: tr.toWarehouseId } },
          create: { productId: it.productId, warehouseId: tr.toWarehouseId, unit: it.unit, quantity: 0, reserved: 0, minThreshold: 0 },
          update: {},
        })
        if (toInv.unit !== it.unit) throw new Error('UNIT_MISMATCH')
        const toQty = Number(toInv.quantity)
        const toReserved = Number((toInv as any).reserved ?? 0)
        const nextToQty = toQty + qty
        await tx.shopInventoryItem.update({ where: { id: toInv.id }, data: { quantity: nextToQty } })
        if (tr.toWarehouseId === 1 && it.unit === 'pcs') {
          await tx.shopProduct.update({ where: { id: it.productId }, data: { stock: Math.max(0, Math.trunc(nextToQty - toReserved)) } })
        }

        if (tr.toLocationId) {
          const ls = await tx.warehouseLocationStock.upsert({
            where: { warehouseId_locationId_productId: { warehouseId: tr.toWarehouseId, locationId: tr.toLocationId, productId: it.productId } },
            create: { warehouseId: tr.toWarehouseId, locationId: tr.toLocationId, productId: it.productId, unit: it.unit, quantity: 0 },
            update: {},
          })
          if (ls.unit !== it.unit) throw new Error('UNIT_MISMATCH')
          const locQty = Number(ls.quantity)
          await tx.warehouseLocationStock.update({ where: { id: ls.id }, data: { quantity: locQty + qty } })
        }

        const outComment = `Перемещение ${tr.id}: ${tr.fromWarehouse.code}${tr.fromLocation ? `/${tr.fromLocation.code}` : ''} → ${tr.toWarehouse.code}${tr.toLocation ? `/${tr.toLocation.code}` : ''}`

        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: access.userId,
            actorRole: access.role,
            actionType: 'transfer_out',
            reason: 'transfer',
            productId: it.productId,
            warehouseId: tr.fromWarehouseId,
            locationId: tr.fromLocationId ?? null,
            sku: it.sku,
            productName: it.productName,
            quantityDelta: -qty,
            unit: it.unit,
            comment: outComment,
            ipHash: meta.ipHash,
            userAgent: meta.userAgent,
          },
        })

        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: access.userId,
            actorRole: access.role,
            actionType: 'transfer_in',
            reason: 'transfer',
            productId: it.productId,
            warehouseId: tr.toWarehouseId,
            locationId: tr.toLocationId ?? null,
            sku: it.sku,
            productName: it.productName,
            quantityDelta: qty,
            unit: it.unit,
            comment: outComment,
            ipHash: meta.ipHash,
            userAgent: meta.userAgent,
          },
        })
      }

      await tx.warehouseTransfer.update({ where: { id: tr.id }, data: { status: 'posted', postedAt: new Date(), postedByUserId: access.userId } })
    })

    await logAudit({ actorUserId: access.userId, action: 'warehouse.transfer.post', target: tr.id })
    revalidatePath('/admin/warehouse')
    revalidatePath('/admin/warehouse/catalog')
    revalidatePath('/admin/warehouse/low-stock')
    revalidatePath('/admin/warehouse/transfers')
    revalidatePath(`/admin/warehouse/transfers/${tr.id}`)
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch (e) {
    if (e instanceof Error && e.message === 'UNIT_MISMATCH') return { ok: false as const, error: 'Несовпадение единиц измерения' }
    if (e instanceof Error && e.message === 'OUT_OF_STOCK') return { ok: false as const, error: 'Недостаточно свободного остатка' }
    if (e instanceof Error && e.message === 'OUT_OF_STOCK_LOCATION') return { ok: false as const, error: 'Недостаточно остатка в локации' }
    return { ok: false as const, error: 'Не удалось провести перемещение' }
  }
}

