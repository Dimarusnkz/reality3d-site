'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { getUserAccessContext, hasPermission } from '@/lib/access'
import { getLogMeta } from '@/lib/shop/log-meta'
import { logAudit } from '@/lib/audit'
import { toKopeks } from '@/lib/shop/money'
import { getDefaultWarehouseId } from '@/lib/warehouse/default-warehouse'

const supplierSchema = z.object({
  name: z.string().trim().min(2).max(200),
  contact: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().max(120).optional().nullable(),
  contractNumber: z.string().trim().max(80).optional().nullable(),
  isActive: z.boolean().optional().nullable(),
})

const receiptCreateSchema = z.object({
  warehouseId: z.number().int().positive().optional().nullable(),
  locationId: z.number().int().positive().optional().nullable(),
  supplierId: z.number().int().positive().optional().nullable(),
  documentNo: z.string().trim().min(1).max(120),
  receivedAt: z.string().trim().optional().nullable(),
  attachmentUrl: z.string().trim().url().optional().nullable(),
  comment: z.string().trim().max(500).optional().nullable(),
})

const receiptItemSchema = z.object({
  productId: z.number().int().positive().optional().nullable(),
  sku: z.string().trim().max(80).optional().nullable(),
  productName: z.string().trim().min(2).max(200),
  quantity: z.string().trim().min(1).max(32),
  unit: z.enum(['pcs', 'm', 'kg']),
  unitCostRub: z.number().min(0),
})

function parseQuantity(input: string) {
  const normalized = input.replace(',', '.')
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

async function requireWarehouseReceiptAccess() {
  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }
  const permitted = await hasPermission(access.userId, access.role, 'warehouse.receipt')
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }
  return { ok: true as const, access }
}

export async function createWarehouseSupplier(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }
  const permitted = await hasPermission(access.userId, access.role, 'warehouse.receipt')
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }

  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    const created = await prisma.warehouseSupplier.create({
      data: {
        name: parsed.data.name,
        contact: parsed.data.contact || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        contractNumber: parsed.data.contractNumber || null,
        isActive: parsed.data.isActive == null ? true : Boolean(parsed.data.isActive),
      },
      select: { id: true, name: true },
    })
    await logAudit({ actorUserId: access.userId, action: 'warehouse.supplier.create', target: String(created.id) })
    revalidatePath('/admin/warehouse/suppliers')
    return { ok: true as const, supplier: created }
  } catch {
    return { ok: false as const, error: 'Не удалось создать поставщика' }
  }
}

export async function updateWarehouseSupplier(id: number, input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }
  const permitted = await hasPermission(access.userId, access.role, 'warehouse.receipt')
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }

  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    await prisma.warehouseSupplier.update({
      where: { id },
      data: {
        name: parsed.data.name,
        contact: parsed.data.contact || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        contractNumber: parsed.data.contractNumber || null,
        isActive: parsed.data.isActive == null ? true : Boolean(parsed.data.isActive),
      },
    })
    await logAudit({ actorUserId: access.userId, action: 'warehouse.supplier.update', target: String(id) })
    revalidatePath('/admin/warehouse/suppliers')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось сохранить поставщика' }
  }
}

export async function createWarehouseReceipt(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireWarehouseReceiptAccess()
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const parsed = receiptCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const receivedAt = parsed.data.receivedAt ? new Date(parsed.data.receivedAt) : new Date()

  try {
    const warehouseId = parsed.data.warehouseId == null ? 1 : parsed.data.warehouseId
    const rec = await prisma.warehouseReceipt.create({
      data: {
        warehouseId,
        locationId: parsed.data.locationId ?? null,
        supplierId: parsed.data.supplierId ?? null,
        documentNo: parsed.data.documentNo,
        receivedAt,
        status: 'draft',
        attachmentUrl: parsed.data.attachmentUrl || null,
        comment: parsed.data.comment || null,
        createdByUserId: access.userId,
      },
      select: { id: true },
    })
    await logAudit({ actorUserId: access.userId, action: 'warehouse.receipt.create', target: rec.id })
    revalidatePath('/admin/warehouse/receipts')
    revalidatePath(`/admin/warehouse/receipts?w=${warehouseId}`)
    return { ok: true as const, id: rec.id }
  } catch {
    return { ok: false as const, error: 'Не удалось создать приход' }
  }
}

export async function updateWarehouseReceipt(id: string, input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireWarehouseReceiptAccess()
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const parsed = receiptCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const existing = await prisma.warehouseReceipt.findUnique({ where: { id }, select: { status: true } })
  if (!existing) return { ok: false as const, error: 'Приход не найден' }
  if (existing.status !== 'draft') return { ok: false as const, error: 'Нельзя редактировать проведённый приход' }

  const receivedAt = parsed.data.receivedAt ? new Date(parsed.data.receivedAt) : undefined

  try {
    await prisma.warehouseReceipt.update({
      where: { id },
      data: {
        warehouseId: parsed.data.warehouseId == null ? undefined : parsed.data.warehouseId,
        locationId: parsed.data.locationId ?? null,
        supplierId: parsed.data.supplierId ?? null,
        documentNo: parsed.data.documentNo,
        ...(receivedAt ? { receivedAt } : {}),
        attachmentUrl: parsed.data.attachmentUrl || null,
        comment: parsed.data.comment || null,
      },
    })
    await logAudit({ actorUserId: access.userId, action: 'warehouse.receipt.update', target: id })
    revalidatePath('/admin/warehouse/receipts')
    if (parsed.data.warehouseId) revalidatePath(`/admin/warehouse/receipts?w=${parsed.data.warehouseId}`)
    revalidatePath(`/admin/warehouse/receipts/${id}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось сохранить приход' }
  }
}

export async function addWarehouseReceiptItem(receiptId: string, input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireWarehouseReceiptAccess()
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const parsed = receiptItemSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const qty = parseQuantity(parsed.data.quantity)
  if (!qty) return { ok: false as const, error: 'Некорректное количество' }
  if (parsed.data.unit === 'pcs' && !Number.isInteger(qty)) return { ok: false as const, error: 'Для шт. нужно целое количество' }

  const receipt = await prisma.warehouseReceipt.findUnique({ where: { id: receiptId }, select: { id: true, status: true, warehouseId: true } })
  if (!receipt) return { ok: false as const, error: 'Приход не найден' }
  if (receipt.status !== 'draft') return { ok: false as const, error: 'Нельзя менять проведённый приход' }

  const unitCostKopeks = toKopeks(parsed.data.unitCostRub)
  const totalCostKopeks = Math.round(unitCostKopeks * qty)

  const meta = await getLogMeta()

  try {
    const item = await prisma.$transaction(async (tx) => {
      let productId = parsed.data.productId ?? null
      let sku = parsed.data.sku || null

      if (!productId) {
        const slugBase = sku ? slugify(sku) : slugify(parsed.data.productName)
        const slug = slugBase ? `${slugBase}-${Date.now()}` : `draft-${Date.now()}`
        const created = await tx.shopProduct.create({
          data: {
            name: parsed.data.productName,
            slug,
            sku,
            itemType: 'material',
            shortDescription: null,
            description: null,
            priceKopeks: 0,
            purchasePriceKopeks: unitCostKopeks,
            compareAtKopeks: null,
            stock: 0,
            allowPreorder: false,
            isActive: false,
            categoryId: null,
          },
          select: { id: true, sku: true },
        })
        productId = created.id
        sku = created.sku || sku
      } else if (!sku) {
        const p = await tx.shopProduct.findUnique({ where: { id: productId }, select: { sku: true } })
        sku = p?.sku || null
      }

      const createdItem = await tx.warehouseReceiptItem.create({
        data: {
          receiptId,
          productId,
          sku,
          productName: parsed.data.productName,
          quantity: qty,
          unit: parsed.data.unit,
          unitCostKopeks,
          totalCostKopeks,
        },
        select: { id: true },
      })

      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: access.userId,
          actorRole: access.role,
          actionType: 'receipt_draft',
          reason: 'purchase',
          productId,
          warehouseId: receipt.warehouseId,
          sku,
          productName: parsed.data.productName,
          quantityDelta: qty,
          unit: parsed.data.unit,
          unitCostKopeks,
          totalCostKopeks,
          shopOrderId: null,
          serviceOrderId: null,
          supplier: null,
          documentNo: null,
          comment: `Черновик прихода ${receiptId}`,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      })

      return createdItem
    })

    await logAudit({ actorUserId: access.userId, action: 'warehouse.receipt.item.add', target: item.id })
    revalidatePath(`/admin/warehouse/receipts/${receiptId}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось добавить позицию' }
  }
}

export async function deleteWarehouseReceiptItem(itemId: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireWarehouseReceiptAccess()
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const item = await prisma.warehouseReceiptItem.findUnique({
    where: { id: itemId },
    select: { id: true, receiptId: true, receipt: { select: { status: true } } },
  })
  if (!item) return { ok: true as const }
  if (item.receipt.status !== 'draft') return { ok: false as const, error: 'Нельзя менять проведённый приход' }

  try {
    await prisma.warehouseReceiptItem.delete({ where: { id: itemId } })
    await logAudit({ actorUserId: access.userId, action: 'warehouse.receipt.item.delete', target: itemId })
    revalidatePath(`/admin/warehouse/receipts/${item.receiptId}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось удалить позицию' }
  }
}

export async function postWarehouseReceipt(receiptId: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requireWarehouseReceiptAccess()
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const defaultWarehouseId = await getDefaultWarehouseId(prisma)
  const meta = await getLogMeta()

  try {
    const receipt = await prisma.warehouseReceipt.findUnique({
      where: { id: receiptId },
      include: { supplier: true, items: true },
    })
    if (!receipt) return { ok: false as const, error: 'Приход не найден' }
    if (receipt.status !== 'draft') return { ok: false as const, error: 'Приход уже проведён' }
    if (receipt.items.length === 0) return { ok: false as const, error: 'Добавьте позиции в приход' }

    await prisma.$transaction(async (tx) => {
      for (const it of receipt.items) {
        if (!it.productId) continue
        const inv = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: it.productId, warehouseId: receipt.warehouseId } },
          create: {
            productId: it.productId,
            warehouseId: receipt.warehouseId,
            unit: it.unit,
            quantity: 0,
            reserved: 0,
            minThreshold: 0,
            lastPurchaseUnitCostKopeks: it.unitCostKopeks,
          },
          update: {},
        })

        if (inv.unit !== it.unit) throw new Error('UNIT_MISMATCH')

        const currentQty = Number(inv.quantity)
        const currentReserved = Number((inv as any).reserved ?? 0)
        const nextQty = currentQty + Number(it.quantity)

        await tx.shopInventoryItem.update({
          where: { id: inv.id },
          data: { quantity: nextQty, lastPurchaseUnitCostKopeks: it.unitCostKopeks },
        })

        await tx.shopProduct.update({
          where: { id: it.productId },
          data: {
            purchasePriceKopeks: it.unitCostKopeks,
            ...(receipt.warehouseId === defaultWarehouseId ? { stock: Math.max(0, Math.trunc(nextQty - currentReserved)) } : {}),
          },
        })

        if (receipt.locationId) {
          const ls = await tx.warehouseLocationStock.upsert({
            where: { warehouseId_locationId_productId: { warehouseId: receipt.warehouseId, locationId: receipt.locationId, productId: it.productId } },
            create: { warehouseId: receipt.warehouseId, locationId: receipt.locationId, productId: it.productId, unit: it.unit, quantity: 0 },
            update: {},
          })
          if (ls.unit !== it.unit) throw new Error('UNIT_MISMATCH')
          await tx.warehouseLocationStock.update({ where: { id: ls.id }, data: { quantity: Number(ls.quantity) + Number(it.quantity) } })
        }

        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: access.userId,
            actorRole: access.role,
            actionType: 'receipt',
            reason: 'purchase',
            productId: it.productId,
            warehouseId: receipt.warehouseId,
            locationId: receipt.locationId,
            sku: it.sku,
            productName: it.productName,
            quantityDelta: it.quantity,
            unit: it.unit,
            unitCostKopeks: it.unitCostKopeks,
            totalCostKopeks: it.totalCostKopeks,
            shopOrderId: null,
            serviceOrderId: null,
            supplier: receipt.supplier?.name || null,
            documentNo: receipt.documentNo,
            comment: receipt.comment || null,
            ipHash: meta.ipHash,
            userAgent: meta.userAgent,
          },
        })
      }

      await tx.warehouseReceipt.update({
        where: { id: receiptId },
        data: { status: 'posted', postedAt: new Date(), postedByUserId: access.userId },
      })
    })

    await logAudit({ actorUserId: access.userId, action: 'warehouse.receipt.post', target: receiptId })
    revalidatePath('/admin/warehouse')
    revalidatePath('/admin/warehouse/catalog')
    revalidatePath('/admin/warehouse/receipts')
    revalidatePath(`/admin/warehouse/receipts/${receiptId}`)
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch (e) {
    if (e instanceof Error && e.message === 'UNIT_MISMATCH') {
      return { ok: false as const, error: 'Несовпадение единицы измерения у товара на складе' }
    }
    return { ok: false as const, error: 'Не удалось провести приход' }
  }
}
