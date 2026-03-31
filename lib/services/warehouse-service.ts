import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getLogMeta } from '@/lib/shop/log-meta'
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid'
import { logAudit } from '@/lib/audit'
import { WarehouseMovementInput, InventorySettingsInput } from '@/lib/schemas/warehouse'

type Unit = 'pcs' | 'm' | 'kg'

export class WarehouseService {
  constructor(private prisma: PrismaClient) {}

  private parseQuantity(input: string, allowNegative = false) {
    const normalized = input.replace(',', '.')
    const value = Number(normalized)
    if (!Number.isFinite(value)) return null
    if (!allowNegative && value <= 0) return null
    return value
  }

  private async notifyLowStock(input: {
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

  async createMovement(data: WarehouseMovementInput, userId: number, role: string, defaultWarehouseId: number) {
    const qty = this.parseQuantity(data.quantity, data.actionType === 'adjustment')
    if (qty === null) throw new Error('Некорректное количество')

    const unit: Unit = data.unit as Unit
    const warehouseId = data.warehouseId == null ? defaultWarehouseId : data.warehouseId
    if (unit === 'pcs' && !Number.isInteger(qty)) throw new Error('Для шт. нужно целое количество')

    if (data.actionType !== 'receipt' && data.actionType !== 'adjustment' && qty > 10 && !['admin', 'manager'].includes(role)) {
      throw new Error('Списание > 10 требует подтверждения менеджера')
    }

    const product = await this.prisma.shopProduct.findUnique({
      where: { id: data.productId },
      select: { id: true, name: true, sku: true, purchasePriceKopeks: true },
    })
    if (!product) throw new Error('Товар не найден')

    const delta =
      data.actionType === 'receipt'
        ? qty
        : data.actionType === 'writeoff' || data.actionType === 'transfer_to_work'
          ? -qty
          : qty // adjustment is as is

    const meta = await getLogMeta()

    const result = await this.prisma.$transaction(async (tx) => {
      const item = await tx.shopInventoryItem.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId } },
        create: { productId: product.id, warehouseId, unit, quantity: 0, reserved: 0, minThreshold: 0 },
        update: {},
      })

      if (item.unit !== unit) {
        throw new Error(`Единица товара на складе: ${item.unit}. Нельзя провести операцию в ${unit}`)
      }

      const currentQty = Number(item.quantity)
      const currentReserved = Number((item as any).reserved ?? 0)
      const next = currentQty + delta
      if (next < 0) throw new Error('Недостаточно остатка')
      if (data.actionType !== 'receipt' && next < currentReserved) {
        throw new Error('Нельзя списать ниже резерва')
      }

      const updated = await tx.shopInventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: next,
          ...(data.actionType === 'receipt' && product.purchasePriceKopeks != null
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
          actorUserId: userId,
          actorRole: role,
          actionType: data.actionType,
          reason: data.reason || null,
          productId: product.id,
          warehouseId,
          locationId: item.locationId ?? null,
          sku: product.sku || null,
          productName: product.name,
          quantityDelta: delta,
          unit,
          unitCostKopeks: null,
          totalCostKopeks: null,
          shopOrderId: data.shopOrderId || null,
          serviceOrderId: data.serviceOrderId || null,
          supplier: data.supplier || null,
          documentNo: data.documentNo || null,
          comment: data.comment || null,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
        },
      })

      return updated
    })

    const minThreshold = Number(result.minThreshold)
    const quantity = Number(result.quantity)
    const reserved = Number((result as any).reserved ?? 0)
    const free = quantity - reserved
    if (free <= minThreshold && minThreshold > 0) {
      await this.notifyLowStock({
        sku: product.sku || null,
        name: product.name,
        quantity: String(Math.max(0, free)),
        minThreshold: String(minThreshold),
        unit,
      })
    }

    await logAudit({
      actorUserId: userId,
      action: 'warehouse.movement',
      target: product.sku || String(product.id),
      metadata: { actionType: data.actionType, delta, unit, reason: data.reason || null },
    })

    revalidatePath('/admin/warehouse')
    revalidatePath(`/admin/warehouse?w=${warehouseId}`)
    revalidatePath(`/admin/warehouse/operations?w=${warehouseId}`)
    revalidatePath('/admin/logs')

    return result
  }

  async updateSettings(data: InventorySettingsInput, userId: number, role: string, defaultWarehouseId: number) {
    const min = this.parseQuantity(data.minThreshold === '' ? '0' : data.minThreshold) ?? 0
    const unit: Unit = data.unit as Unit
    const warehouseId = data.warehouseId == null ? defaultWarehouseId : data.warehouseId
    if (unit === 'pcs' && !Number.isInteger(min)) throw new Error('Для шт. порог должен быть целым')

    const product = await this.prisma.shopProduct.findUnique({ where: { id: data.productId }, select: { id: true, sku: true } })
    if (!product) throw new Error('Товар не найден')

    const meta = await getLogMeta()

    await this.prisma.$transaction(async (tx) => {
      const item = await tx.shopInventoryItem.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId } },
        create: { productId: product.id, warehouseId, unit, quantity: 0, reserved: 0, minThreshold: min },
        update: { unit, minThreshold: min },
      })

      await tx.shopWarehouseLog.create({
        data: {
          actorUserId: userId,
          actorRole: role,
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
  }

  /**
   * Возвращает товары из отмененного заказа в магазин на склад.
   */
  async returnShopOrderItemsToStock(shopOrderId: string, userId: number, role: string, defaultWarehouseId: number) {
    const order = await this.prisma.shopOrder.findUnique({
      where: { id: shopOrderId },
      include: { items: { include: { product: true } } }
    })
    if (!order) throw new Error('Заказ не найден')

    const meta = await getLogMeta()

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.product || !item.productId) continue

        const qty = Number(item.quantity)
        const unit = (item.product as any).unit || 'pcs'

        const inventory = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: defaultWarehouseId } },
          create: { productId: item.productId, warehouseId: defaultWarehouseId, unit, quantity: qty, reserved: 0, minThreshold: 0 },
          update: { quantity: { increment: qty } }
        })

        if (unit === 'pcs') {
          await tx.shopProduct.update({
            where: { id: item.productId },
            data: { stock: { increment: Math.trunc(qty) } }
          })
        }

        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: userId,
            actorRole: role,
            actionType: 'receipt',
            reason: 'inventory',
            productId: item.productId,
            warehouseId: defaultWarehouseId,
            sku: item.product.sku,
            productName: item.product.name,
            quantityDelta: qty,
            unit,
            shopOrderId: order.id,
            comment: `Возврат при отмене заказа #${order.orderNo}`,
            ipHash: meta.ipHash,
            userAgent: meta.userAgent,
          }
        })
      }
    })

    revalidatePath('/admin/warehouse')
    revalidatePath('/admin/shop/orders')
  }
}
