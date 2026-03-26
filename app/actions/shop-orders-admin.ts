'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { requirePermission } from '@/lib/access'
import { logAudit } from '@/lib/audit'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid'
import { getDefaultWarehouseId } from '@/lib/warehouse/default-warehouse'

const updateSchema = z.object({
  status: z.string().trim().max(40).optional().nullable(),
  shippingStatus: z.string().trim().max(40).optional().nullable(),
  shippingCarrier: z.string().trim().max(40).optional().nullable(),
  shippingTrackingNo: z.string().trim().max(120).optional().nullable(),
  shippingCostFinalKopeks: z.number().int().nonnegative().optional().nullable(),
})

export async function updateShopOrderAdmin(orderId: string, input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('shop.orders.manage')
  if (!access.ok) return access

  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    select: { id: true, orderNo: true, contactEmail: true, publicAccessToken: true },
  })
  if (!order) return { ok: false as const, error: 'Заказ не найден' }

  const patch: any = {}
  if (parsed.data.status != null) patch.status = parsed.data.status
  if (parsed.data.shippingStatus != null) patch.shippingStatus = parsed.data.shippingStatus
  if (parsed.data.shippingCarrier != null) patch.shippingCarrier = parsed.data.shippingCarrier
  if (parsed.data.shippingTrackingNo != null) patch.shippingTrackingNo = parsed.data.shippingTrackingNo
  if (parsed.data.shippingCostFinalKopeks != null) patch.shippingCostFinalKopeks = parsed.data.shippingCostFinalKopeks

  try {
    await prisma.shopOrder.update({ where: { id: order.id }, data: patch })
    await logAudit({ actorUserId: access.userId, action: 'shop.order.admin.update', target: String(order.orderNo), metadata: { orderId: order.id, patch } })

    if (parsed.data.status === 'shipped') {
      sendTelegramMessage(`<b>Заказ отправлен</b> #${order.orderNo}${parsed.data.shippingTrackingNo ? `\nТрек: <code>${parsed.data.shippingTrackingNo}</code>` : ''}`).catch(() => {})
      const from = process.env.SENDGRID_FROM_EMAIL || ''
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
      if (from && order.contactEmail && siteUrl) {
        const link = order.publicAccessToken
          ? `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}?token=${order.publicAccessToken}`
          : `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}`
        sendEmailViaSendGrid({
          to: [order.contactEmail],
          from,
          subject: `Reality3D: заказ #${order.orderNo} отправлен`,
          text:
            `Заказ #${order.orderNo} отправлен.\n` +
            `${parsed.data.shippingTrackingNo ? `Трек-номер: ${parsed.data.shippingTrackingNo}\n` : ''}` +
            `\nСтраница заказа: ${link}\n`,
        }).catch(() => {})
      }
    }

    revalidatePath('/admin/shop/orders')
    revalidatePath(`/admin/shop/orders/${order.id}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось сохранить' }
  }
}

export async function confirmShopOrderPaymentAdmin(orderId: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('shop.orders.manage')
  if (!access.ok) return access
  if (access.role !== 'admin') return { ok: false as const, error: 'Unauthorized' }

  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return { ok: false as const, error: 'Заказ не найден' }
  if (order.paymentStatus === 'paid' || order.status === 'paid') return { ok: true as const }
  const defaultWarehouseId = await getDefaultWarehouseId(prisma)

  const from = process.env.SENDGRID_FROM_EMAIL || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const paymentUrl = process.env.NEXT_PUBLIC_TBANK_SELFEMPLOYED_PAYMENT_URL || 'https://www.tinkoff.ru/rm/r_JESjEcBisx.CSUFIGiBXm/5zoeh15252'

  try {
    const paymentId = `manual-${order.orderNo}-${Date.now()}`
    const payment = await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.shopPayment.create({
        data: {
          orderId: order.id,
          provider: 'tbank_link',
          status: 'succeeded',
          amountKopeks: order.totalKopeks,
          currency: 'RUB',
          externalPaymentId: paymentId,
          paymentUrl,
        },
        select: { id: true },
      })

      await tx.shopOrder.update({
        where: { id: order.id },
        data: { paymentStatus: 'paid', status: 'paid', paymentProvider: 'tbank_link' },
      })

      const alreadyWrittenOff = await tx.shopWarehouseLog.findFirst({
        where: { shopOrderId: order.id, actionType: 'writeoff', reason: 'sale' },
        select: { id: true },
      })

      if (!alreadyWrittenOff) {
        for (const item of order.items) {
          if (!item.productId) continue
          const inv = await tx.shopInventoryItem.upsert({
            where: { productId_warehouseId: { productId: item.productId, warehouseId: defaultWarehouseId } },
            create: { productId: item.productId, warehouseId: defaultWarehouseId, unit: 'pcs', quantity: 0, reserved: 0, minThreshold: 0 },
            update: {},
          })

          const currentQty = Number(inv.quantity)
          const currentReserved = Number((inv as any).reserved ?? 0)
          const nextQty = Math.max(0, currentQty - item.quantity)
          const nextReserved = Math.max(0, currentReserved - item.quantity)
          await tx.shopInventoryItem.update({
            where: { id: inv.id },
            data: { quantity: nextQty, reserved: nextReserved },
          })

          await tx.shopProduct.update({
            where: { id: item.productId },
            data: { stock: Math.max(0, Math.trunc(nextQty - nextReserved)) },
          })

          const unitCostKopeks = inv.lastPurchaseUnitCostKopeks ?? null
          const totalCostKopeks = unitCostKopeks == null ? null : unitCostKopeks * item.quantity

          await tx.shopWarehouseLog.create({
            data: {
              actorUserId: access.userId,
              actorRole: access.role,
              actionType: 'writeoff',
              reason: 'sale',
              productId: item.productId,
              warehouseId: defaultWarehouseId,
              locationId: inv.locationId ?? null,
              sku: item.sku || null,
              productName: item.productName,
              quantityDelta: -item.quantity,
              unit: 'pcs',
              unitCostKopeks,
              totalCostKopeks,
              shopOrderId: order.id,
              serviceOrderId: null,
              supplier: null,
              documentNo: null,
              comment:
                currentQty >= item.quantity
                  ? `Ручное списание по оплате заказа #${order.orderNo}`
                  : `Ручное списание по оплате заказа #${order.orderNo} (нехватка остатка: было ${currentQty})`,
              ipHash: null,
              userAgent: null,
            },
          })
        }
      }

      const account = (await tx.cashAccount.findUnique({ where: { code: 'bank' }, select: { id: true } })) || (await tx.cashAccount.findUnique({ where: { code: 'online' }, select: { id: true } }))
      if (account) {
        const existing = await tx.cashEntry.findUnique({ where: { shopPaymentId: createdPayment.id }, select: { id: true } })
        if (!existing) {
          await tx.cashEntry.create({
            data: {
              accountId: account.id,
              direction: 'income',
              entryType: 'order_payment',
              amountKopeks: order.totalKopeks,
              currency: 'RUB',
              description: `Оплата заказа #${order.orderNo} (ручная)`,
              status: 'confirmed',
              shopOrderId: order.id,
              shopPaymentId: createdPayment.id,
              warehouseLogId: null,
              createdByUserId: access.userId,
              ipHash: null,
              userAgent: null,
            },
          })
        }
      }

      return createdPayment
    })

    await logAudit({
      actorUserId: access.userId,
      action: 'shop.order.payment.confirm',
      target: String(order.orderNo),
      metadata: { orderId: order.id, shopPaymentId: payment.id, provider: 'tbank_link' },
    })

    sendTelegramMessage(`<b>Оплата получена</b> #${order.orderNo}\nСумма: <b>${(order.totalKopeks / 100).toFixed(2)} ₽</b>`).catch(() => {})
    if (from && order.contactEmail) {
      const link = siteUrl
        ? order.publicAccessToken
          ? `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}?token=${order.publicAccessToken}`
          : `${siteUrl.replace(/\/$/, '')}/shop/order/${order.id}`
        : ''
      sendEmailViaSendGrid({
        to: [order.contactEmail],
        from,
        subject: `Reality3D: заказ #${order.orderNo} оплачен`,
        text: `Оплата получена по заказу #${order.orderNo}.\n\nСумма: ${(order.totalKopeks / 100).toFixed(2)} ₽\n\n${link ? `Страница заказа: ${link}\n` : ''}`,
      }).catch(() => {})
    }

    revalidatePath('/admin/shop/orders')
    revalidatePath(`/admin/shop/orders/${order.id}`)
    revalidatePath(`/shop/order/${order.id}`)
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось подтвердить оплату' }
  }
}

export async function cancelShopOrderAdmin(orderId: string, reason: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('shop.orders.manage')
  if (!access.ok) return access

  const order = await prisma.shopOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return { ok: false as const, error: 'Заказ не найден' }
  if (order.status === 'cancelled') return { ok: true as const }

  const defaultWarehouseId = await getDefaultWarehouseId(prisma)

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Change status
      await tx.shopOrder.update({
        where: { id: order.id },
        data: { status: 'cancelled' },
      })

      // 2. Return items to stock/reserve
      for (const item of order.items) {
        if (!item.productId) continue
        
        const inv = await tx.shopInventoryItem.upsert({
          where: { productId_warehouseId: { productId: item.productId, warehouseId: defaultWarehouseId } },
          create: { productId: item.productId, warehouseId: defaultWarehouseId, unit: 'pcs', quantity: 0, reserved: 0, minThreshold: 0 },
          update: {},
        })

        const currentQty = Number(inv.quantity)
        const currentReserved = Number((inv as any).reserved ?? 0)
        
        // If order was paid, it was written off. If unpaid, it was reserved.
        const wasPaid = order.paymentStatus === 'paid'
        
        let nextQty = currentQty
        let nextReserved = currentReserved
        let actionType: 'receipt' | 'reserve' = 'receipt'
        let delta = item.quantity

        if (wasPaid) {
          // It was written off (qty decreased). Return to qty.
          nextQty = currentQty + item.quantity
          actionType = 'receipt'
          delta = item.quantity
        } else {
          // It was only reserved (reserved increased). Release reserve.
          nextReserved = Math.max(0, currentReserved - item.quantity)
          actionType = 'reserve'
          delta = -item.quantity
        }

        await tx.shopInventoryItem.update({
          where: { id: inv.id },
          data: { quantity: nextQty, reserved: nextReserved },
        })

        await tx.shopProduct.update({
          where: { id: item.productId },
          data: { stock: Math.max(0, Math.trunc(nextQty - nextReserved)) },
        })

        await tx.shopWarehouseLog.create({
          data: {
            actorUserId: access.userId,
            actorRole: access.role,
            actionType,
            reason: 'internal',
            productId: item.productId,
            warehouseId: defaultWarehouseId,
            sku: item.sku || null,
            productName: item.productName,
            quantityDelta: delta,
            unit: 'pcs',
            shopOrderId: order.id,
            comment: `Возврат на склад при отмене заказа #${order.orderNo}. Причина: ${reason}`,
          },
        })
      }

      // 3. Create Refund Cash Entry if paid
      if (order.paymentStatus === 'paid') {
        const account = (await tx.cashAccount.findUnique({ where: { code: 'bank' }, select: { id: true } })) || 
                        (await tx.cashAccount.findUnique({ where: { code: 'online' }, select: { id: true } }))
        if (account) {
          await tx.cashEntry.create({
            data: {
              accountId: account.id,
              direction: 'outcome',
              entryType: 'refund',
              amountKopeks: order.totalKopeks,
              currency: 'RUB',
              description: `Возврат средств по заказу #${order.orderNo} (отмена)`,
              status: 'confirmed',
              shopOrderId: order.id,
              createdByUserId: access.userId,
            },
          })
        }
      }
    })

    await logAudit({
      actorUserId: access.userId,
      action: 'shop.order.cancel',
      target: String(order.orderNo),
      metadata: { orderId: order.id, reason },
    })

    revalidatePath('/admin/shop/orders')
    revalidatePath(`/admin/shop/orders/${order.id}`)
    return { ok: true as const }
  } catch (e) {
    console.error('Cancel error:', e)
    return { ok: false as const, error: 'Не удалось отменить заказ' }
  }
}

export async function deleteShopOrderAdmin(orderId: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('shop.orders.manage')
  if (!access.ok) return access
  if (access.role !== 'admin') return { ok: false as const, error: 'Только администратор может удалять заказы' }

  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: orderId },
      include: { items: true }
    })
    if (!order) return { ok: true as const }

    // 1. Check for payments
    const paymentsCount = await prisma.shopPayment.count({
      where: { orderId: orderId, status: 'succeeded' }
    })
    if (paymentsCount > 0) {
      return { ok: false as const, error: 'Ошибка: Нельзя удалить заказ, так как по нему есть успешная оплата.' }
    }

    // 2. Check for warehouse operations
    const warehouseLogsCount = await prisma.shopWarehouseLog.count({
      where: { shopOrderId: orderId }
    })
    if (warehouseLogsCount > 0) {
      return { ok: false as const, error: 'Ошибка: Нельзя удалить заказ, так как по нему были складские операции (резерв или списание).' }
    }

    // 3. Check for cash entries
    const cashEntriesCount = await prisma.cashEntry.count({
      where: { shopOrderId: orderId }
    })
    if (cashEntriesCount > 0) {
      return { ok: false as const, error: 'Ошибка: Нельзя удалить заказ, так как он связан с финансовыми операциями.' }
    }

    // If everything is clean, we can delete
    await prisma.$transaction(async (tx) => {
      await tx.shopOrderItem.deleteMany({ where: { orderId } })
      await tx.shopPayment.deleteMany({ where: { orderId } })
      await tx.shopOrder.delete({ where: { id: orderId } })
    })

    await logAudit({
      actorUserId: access.userId,
      action: 'shop.order.delete',
      target: String(order.orderNo),
    })

    revalidatePath('/admin/shop/orders')
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: 'Не удалось удалить заказ. Возможно, он связан с другими документами.' }
  }
}

