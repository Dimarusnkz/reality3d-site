'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { requirePermission } from '@/lib/access'
import { logAudit } from '@/lib/audit'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid'

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
