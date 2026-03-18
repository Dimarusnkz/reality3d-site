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

async function requirePerm(permissionKey: Parameters<typeof hasPermission>[2]) {
  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }
  const permitted = await hasPermission(access.userId, access.role, permissionKey)
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }
  return { ok: true as const, access }
}

const locationSchema = z.object({
  code: z.string().trim().min(1).max(40).regex(/^[a-z0-9-_.]+$/i),
  name: z.string().trim().min(2).max(120),
  isActive: z.boolean().optional().nullable(),
})

export async function createWarehouseLocation(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.locations.manage')
  if (!accessRes.ok) return accessRes

  const parsed = locationSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    const created = await prisma.warehouseLocation.create({
      data: {
        warehouseId: 1,
        code: parsed.data.code,
        name: parsed.data.name,
        isActive: parsed.data.isActive == null ? true : Boolean(parsed.data.isActive),
      },
      select: { id: true, code: true, name: true, isActive: true },
    })
    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.location.create', target: String(created.id) })
    revalidatePath('/admin/warehouse/locations')
    return { ok: true as const, location: created }
  } catch {
    return { ok: false as const, error: 'Не удалось создать локацию' }
  }
}

export async function updateWarehouseLocation(id: number, input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.locations.manage')
  if (!accessRes.ok) return accessRes

  const parsed = locationSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    await prisma.warehouseLocation.update({
      where: { id },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        isActive: parsed.data.isActive == null ? true : Boolean(parsed.data.isActive),
      },
    })
    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.location.update', target: String(id) })
    revalidatePath('/admin/warehouse/locations')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось сохранить локацию' }
  }
}

const recipeItemSchema = z.object({
  materialProductId: z.number().int().positive(),
  quantity: z.string().trim().min(1).max(32),
  unit: z.enum(['pcs', 'kg', 'm']),
})

const recipeSchema = z.object({
  productId: z.number().int().positive(),
  isActive: z.boolean().optional().nullable(),
  items: z.array(recipeItemSchema).max(200),
})

export async function saveWarehouseRecipe(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.recipes.manage')
  if (!accessRes.ok) return accessRes

  const parsed = recipeSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const prepared = []
  for (const it of parsed.data.items) {
    const qty = parseDecimal(it.quantity)
    if (!qty || qty <= 0) return { ok: false as const, error: 'Некорректное количество в рецепте' }
    if (it.unit === 'pcs' && !Number.isInteger(qty)) return { ok: false as const, error: 'Для шт. в рецепте нужно целое количество' }
    prepared.push({ materialProductId: it.materialProductId, quantity: qty, unit: it.unit })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.warehouseRecipe.findUnique({
        where: { productId: parsed.data.productId },
        select: { id: true, version: true },
      })

      const recipe = existing
        ? await tx.warehouseRecipe.update({
            where: { id: existing.id },
            data: { isActive: parsed.data.isActive == null ? true : Boolean(parsed.data.isActive), version: existing.version + 1 },
            select: { id: true },
          })
        : await tx.warehouseRecipe.create({
            data: { productId: parsed.data.productId, isActive: parsed.data.isActive == null ? true : Boolean(parsed.data.isActive) },
            select: { id: true },
          })

      await tx.warehouseRecipeItem.deleteMany({ where: { recipeId: recipe.id } })
      if (prepared.length > 0) {
        await tx.warehouseRecipeItem.createMany({
          data: prepared.map((it) => ({ recipeId: recipe.id, materialProductId: it.materialProductId, quantity: it.quantity, unit: it.unit })),
        })
      }
    })

    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.recipe.save', target: String(parsed.data.productId) })
    revalidatePath('/admin/warehouse/recipes')
    revalidatePath(`/admin/warehouse/recipes/${parsed.data.productId}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось сохранить рецептуру' }
  }
}

const productionCreateSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.string().trim().min(1).max(32),
  unit: z.enum(['pcs']),
  comment: z.string().trim().max(500).optional().nullable(),
})

export async function createWarehouseProductionOrder(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.production')
  if (!accessRes.ok) return accessRes

  const parsed = productionCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }
  const qty = parseDecimal(parsed.data.quantity)
  if (!qty || qty <= 0 || !Number.isInteger(qty)) return { ok: false as const, error: 'Некорректное количество' }

  try {
    const created = await prisma.warehouseProductionOrder.create({
      data: {
        warehouseId: 1,
        productId: parsed.data.productId,
        quantity: qty,
        unit: parsed.data.unit,
        status: 'draft',
        comment: parsed.data.comment || null,
        createdByUserId: accessRes.access.userId,
      },
      select: { id: true },
    })
    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.production.create', target: created.id })
    revalidatePath('/admin/warehouse/production')
    return { ok: true as const, id: created.id }
  } catch {
    return { ok: false as const, error: 'Не удалось создать производство' }
  }
}

export async function postWarehouseProductionOrder(id: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.production')
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const meta = await getLogMeta()

  try {
    const prod = await prisma.warehouseProductionOrder.findUnique({
      where: { id },
      include: { product: { select: { id: true, name: true, sku: true } }, consumes: true },
    })
    if (!prod) return { ok: false as const, error: 'Производство не найдено' }
    if (prod.status !== 'draft') return { ok: false as const, error: 'Уже проведено' }

    const recipe = await prisma.warehouseRecipe.findUnique({
      where: { productId: prod.productId },
      include: { items: true },
    })
    if (!recipe || !recipe.isActive) return { ok: false as const, error: 'Нет активной рецептуры' }
    if (recipe.items.length === 0) return { ok: false as const, error: 'Рецептура пустая' }

    const outQty = Number(prod.quantity)

    await prisma.$transaction(async (tx) => {
      const materialLines = []
      for (const it of recipe.items) {
        const perUnit = Number(it.quantity)
        const required = perUnit * outQty
        if (required <= 0) continue
        materialLines.push({ materialProductId: it.materialProductId, unit: it.unit, required })
      }

      for (const line of materialLines) {
        const inv = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: line.materialProductId, warehouseId: 1 } },
          create: { productId: line.materialProductId, warehouseId: 1, unit: line.unit, quantity: 0, reserved: 0, minThreshold: 0 },
          update: {},
        })

        if (inv.unit !== line.unit) throw new Error('UNIT_MISMATCH')

        const currentQty = Number(inv.quantity)
        const reserved = Number((inv as any).reserved ?? 0)
        const free = currentQty - reserved
        if (free < line.required) throw new Error('OUT_OF_STOCK')

        const nextQty = currentQty - line.required
        await tx.shopInventoryItem.update({ where: { id: inv.id }, data: { quantity: nextQty } })

        const unitCostKopeks = inv.lastPurchaseUnitCostKopeks ?? null
        const totalCostKopeks = unitCostKopeks == null ? null : Math.round(unitCostKopeks * line.required)

        await tx.warehouseProductionConsumeItem.create({
          data: {
            productionId: prod.id,
            materialProductId: line.materialProductId,
            quantity: line.required,
            unit: line.unit,
            unitCostKopeks,
            totalCostKopeks,
          },
        })

        const material = await tx.shopProduct.findUnique({ where: { id: line.materialProductId }, select: { sku: true, name: true } })

        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: access.userId,
            actorRole: access.role,
            actionType: 'production_consume',
            reason: 'production',
            productId: line.materialProductId,
            warehouseId: 1,
            locationId: inv.locationId ?? null,
            sku: material?.sku || null,
            productName: material?.name || null,
            quantityDelta: -line.required,
            unit: line.unit,
            unitCostKopeks,
            totalCostKopeks,
            comment: `Производство ${prod.id}`,
            ipHash: meta.ipHash,
            userAgent: meta.userAgent,
          },
        })
      }

      const outInv = await tx.shopInventoryItem.upsert({
        where: { productId_warehouseId: { productId: prod.productId, warehouseId: 1 } },
        create: { productId: prod.productId, warehouseId: 1, unit: 'pcs', quantity: 0, reserved: 0, minThreshold: 0 },
        update: {},
      })
      if (outInv.unit !== 'pcs') throw new Error('UNIT_MISMATCH')
      const outCurrent = Number(outInv.quantity)
      const outReserved = Number((outInv as any).reserved ?? 0)
      const outNext = outCurrent + outQty

      await tx.shopInventoryItem.update({ where: { id: outInv.id }, data: { quantity: outNext } })
      await tx.shopProduct.update({ where: { id: prod.productId }, data: { stock: Math.max(0, Math.trunc(outNext - outReserved)) } })

      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: access.userId,
          actorRole: access.role,
          actionType: 'production_output',
          reason: 'production',
          productId: prod.productId,
          warehouseId: 1,
          locationId: outInv.locationId ?? null,
          sku: prod.product.sku || null,
          productName: prod.product.name,
          quantityDelta: outQty,
          unit: 'pcs',
          unitCostKopeks: null,
          totalCostKopeks: null,
          comment: `Выпуск по производству ${prod.id}`,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      })

      await tx.warehouseProductionOrder.update({
        where: { id: prod.id },
        data: { status: 'posted', postedAt: new Date(), postedByUserId: access.userId },
      })
    })

    await logAudit({ actorUserId: access.userId, action: 'warehouse.production.post', target: id })
    revalidatePath('/admin/warehouse')
    revalidatePath('/admin/warehouse/catalog')
    revalidatePath('/admin/warehouse/production')
    revalidatePath(`/admin/warehouse/production/${id}`)
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch (e) {
    if (e instanceof Error && e.message === 'UNIT_MISMATCH') return { ok: false as const, error: 'Несовпадение единиц измерения' }
    if (e instanceof Error && e.message === 'OUT_OF_STOCK') return { ok: false as const, error: 'Недостаточно сырья' }
    return { ok: false as const, error: 'Не удалось провести производство' }
  }
}

const inventoryCreateSchema = z.object({
  comment: z.string().trim().max(500).optional().nullable(),
})

export async function createWarehouseInventoryCount(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.inventory')
  if (!accessRes.ok) return accessRes

  const parsed = inventoryCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    const created = await prisma.warehouseInventoryCount.create({
      data: { warehouseId: 1, status: 'draft', comment: parsed.data.comment || null, createdByUserId: accessRes.access.userId },
      select: { id: true },
    })
    await logAudit({ actorUserId: accessRes.access.userId, action: 'warehouse.inventory.create', target: created.id })
    revalidatePath('/admin/warehouse/inventory')
    return { ok: true as const, id: created.id }
  } catch {
    return { ok: false as const, error: 'Не удалось создать инвентаризацию' }
  }
}

const inventoryItemSetSchema = z.object({
  inventoryId: z.string().uuid(),
  productId: z.number().int().positive(),
  countedQty: z.string().trim().min(1).max(32),
})

export async function setWarehouseInventoryCountItem(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.inventory')
  if (!accessRes.ok) return accessRes

  const parsed = inventoryItemSetSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const qty = parseDecimal(parsed.data.countedQty)
  if (qty == null || qty < 0) return { ok: false as const, error: 'Некорректное количество' }

  const inv = await prisma.warehouseInventoryCount.findUnique({ where: { id: parsed.data.inventoryId }, select: { id: true, status: true } })
  if (!inv) return { ok: false as const, error: 'Инвентаризация не найдена' }
  if (inv.status !== 'draft') return { ok: false as const, error: 'Нельзя менять проведённую инвентаризацию' }

  const inventory = await prisma.shopInventoryItem.findUnique({
    where: { productId_warehouseId: { productId: parsed.data.productId, warehouseId: 1 } },
    select: { quantity: true, unit: true },
  })

  const expected = inventory ? Number(inventory.quantity) : 0
  const unit = inventory?.unit || 'pcs'
  if (unit === 'pcs' && !Number.isInteger(qty)) return { ok: false as const, error: 'Для шт. нужно целое количество' }

  const delta = qty - expected

  try {
    await prisma.warehouseInventoryCountItem.upsert({
      where: { inventoryId_productId: { inventoryId: parsed.data.inventoryId, productId: parsed.data.productId } },
      create: {
        inventoryId: parsed.data.inventoryId,
        productId: parsed.data.productId,
        expectedQty: expected,
        countedQty: qty,
        delta,
        unit,
      },
      update: { expectedQty: expected, countedQty: qty, delta, unit },
    })
    revalidatePath(`/admin/warehouse/inventory/${parsed.data.inventoryId}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось сохранить позицию' }
  }
}

export async function postWarehouseInventoryCount(id: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const accessRes = await requirePerm('warehouse.inventory')
  if (!accessRes.ok) return accessRes
  const { access } = accessRes

  const meta = await getLogMeta()

  try {
    const inv = await prisma.warehouseInventoryCount.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!inv) return { ok: false as const, error: 'Инвентаризация не найдена' }
    if (inv.status !== 'draft') return { ok: false as const, error: 'Уже проведена' }
    if (inv.items.length === 0) return { ok: false as const, error: 'Нет позиций' }

    await prisma.$transaction(async (tx) => {
      for (const it of inv.items) {
        const item = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: it.productId, warehouseId: 1 } },
          create: { productId: it.productId, warehouseId: 1, unit: it.unit, quantity: 0, reserved: 0, minThreshold: 0 },
          update: {},
        })

        if (item.unit !== it.unit) throw new Error('UNIT_MISMATCH')

        const reserved = Number((item as any).reserved ?? 0)
        const targetQty = Math.max(reserved, Number(it.countedQty))
        const delta = targetQty - Number(item.quantity)

        await tx.shopInventoryItem.update({ where: { id: item.id }, data: { quantity: targetQty } })

        if (item.unit === 'pcs') {
          await tx.shopProduct.update({ where: { id: it.productId }, data: { stock: Math.max(0, Math.trunc(targetQty - reserved)) } })
        }

        const p = await tx.shopProduct.findUnique({ where: { id: it.productId }, select: { sku: true, name: true } })

        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: access.userId,
            actorRole: access.role,
            actionType: 'inventory_adjust',
            reason: 'inventory',
            productId: it.productId,
            warehouseId: 1,
            locationId: item.locationId ?? null,
            sku: p?.sku || null,
            productName: p?.name || null,
            quantityDelta: delta,
            unit: it.unit,
            comment: `Инвентаризация ${inv.id}`,
            ipHash: meta.ipHash,
            userAgent: meta.userAgent,
          },
        })
      }

      await tx.warehouseInventoryCount.update({
        where: { id: inv.id },
        data: { status: 'posted', postedAt: new Date(), postedByUserId: access.userId },
      })
    })

    await logAudit({ actorUserId: access.userId, action: 'warehouse.inventory.post', target: id })
    revalidatePath('/admin/warehouse')
    revalidatePath('/admin/warehouse/catalog')
    revalidatePath('/admin/warehouse/inventory')
    revalidatePath(`/admin/warehouse/inventory/${id}`)
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch (e) {
    if (e instanceof Error && e.message === 'UNIT_MISMATCH') return { ok: false as const, error: 'Несовпадение единиц измерения' }
    return { ok: false as const, error: 'Не удалось провести инвентаризацию' }
  }
}
