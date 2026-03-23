'use server'

import { revalidatePath } from 'next/cache'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { z } from 'zod'
import { requirePermission } from '@/lib/access'
import { logAudit } from '@/lib/audit'

const poSchema = z.object({
  supplierId: z.number().int().positive(),
  orderNo: z.string().trim().min(1).max(50),
  comment: z.string().trim().max(500).optional().nullable(),
  items: z.array(z.object({
    productId: z.number().int().positive().nullable(),
    sku: z.string().trim().max(50).optional().nullable(),
    productName: z.string().trim().min(1).max(200),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1).max(10),
    unitPriceRub: z.number().nonnegative(),
  }))
})

export async function createPurchaseOrder(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('warehouse.purchase.manage')
  if (!access.ok) return access

  const parsed = poSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const totalKopeks = parsed.data.items.reduce((sum, i) => sum + Math.round(i.unitPriceRub * 100 * i.quantity), 0)

  try {
    const order = await prisma.warehousePurchaseOrder.create({
      data: {
        supplierId: parsed.data.supplierId,
        orderNo: parsed.data.orderNo,
        comment: parsed.data.comment,
        totalKopeks,
        createdByUserId: access.userId,
        status: 'pending',
        items: {
          create: parsed.data.items.map(i => ({
            productId: i.productId,
            sku: i.sku,
            productName: i.productName,
            quantity: i.quantity,
            unit: i.unit,
            unitPriceKopeks: Math.round(i.unitPriceRub * 100)
          }))
        }
      }
    })

    await logAudit({
      actorUserId: access.userId,
      action: 'warehouse.purchase.create',
      target: order.orderNo,
      metadata: { orderId: order.id }
    })

    revalidatePath('/admin/warehouse/purchase')
    return { ok: true as const, orderId: order.id }
  } catch (e) {
    console.error('PO Create error:', e)
    return { ok: false as const, error: 'Не удалось создать заказ (возможно, номер уже занят)' }
  }
}

export async function getPurchaseOrders() {
  const prisma = getPrisma()
  const access = await requirePermission('warehouse.purchase.view')
  if (!access.ok) return []

  return await prisma.warehousePurchaseOrder.findMany({
    include: {
      supplier: { select: { name: true } },
      _count: { select: { items: true, receipts: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getPurchaseOrderDetails(id: string) {
  const prisma = getPrisma()
  const access = await requirePermission('warehouse.purchase.view')
  if (!access.ok) return null

  return await prisma.warehousePurchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: true,
      receipts: {
        include: { 
          items: true,
          postedBy: { select: { name: true, email: true } }
        }
      }
    }
  })
}

export async function getPurchaseDiscrepancy(poId: string) {
  const prisma = getPrisma()
  const access = await requirePermission('warehouse.purchase.view')
  if (!access.ok) return null

  const po = await prisma.warehousePurchaseOrder.findUnique({
    where: { id: poId },
    include: { 
      items: true,
      receipts: { 
        where: { status: 'posted' },
        include: { items: true } 
      }
    }
  })
  if (!po) return null

  return po.items.map(pi => {
    const received = po.receipts.reduce((sum, r) => {
      const ri = r.items.find(item => item.productId === pi.productId)
      return sum + (ri ? Number(ri.quantity) : 0)
    }, 0)
    return {
      productId: pi.productId,
      productName: pi.productName,
      sku: pi.sku,
      ordered: Number(pi.quantity),
      received,
      diff: received - Number(pi.quantity)
    }
  })
}
