import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendMaxMessage } from '@/lib/max'
import { logAudit } from '@/lib/audit'
import { CreateOrderInput } from '@/lib/schemas/order'

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async createOrder(data: CreateOrderInput, userId: number) {
    const order = await this.prisma.order.create({
      data: {
        userId,
        title: data.title,
        status: 'pending',
        price: data.price || 0,
        details: JSON.stringify(data.details, null, 2),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Send Telegram Notification
    const safeTitle = this.escapeHtml(order.title || 'Без названия')
    const safeName = this.escapeHtml(order.user.name || 'Не указано')
    const safeEmail = this.escapeHtml(order.user.email)
    const safePhone = this.escapeHtml(order.user.phone || 'Не указан')
    const safeDetails = this.escapeHtml(JSON.stringify(data.details, null, 2))
    
    // Detailed list of files if present
    let filesList = '';
    try {
      if (data.details.files && Array.isArray(data.details.files)) {
        filesList = '\n<b>📁 Файлы:</b>\n' + data.details.files.map((f: any) => `- <a href="${process.env.NEXT_PUBLIC_SITE_URL}/api/public/${f.fileUrl}">${f.fileName}</a>`).join('\n');
      }
    } catch (e) {}

    const message = `
<b>📦 НОВЫЙ ЗАКАЗ (РАСЧЕТ) #${order.id}</b>

📝 <b>Название:</b> ${safeTitle}
👤 <b>Клиент:</b> ${safeName} (${safeEmail})
📱 <b>Телефон:</b> ${safePhone}
${filesList}

📝 <b>Детали:</b>
<pre>${safeDetails}</pre>

<a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders">Открыть в админ-панели</a>
    `

    await sendTelegramMessage(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Подтвердить оплату", callback_data: `confirm_payment:calc:${order.id}` }
          ]
        ]
      }
    })

    await sendMaxMessage(message, {
      attachments: [
        {
          type: 'inline_keyboard',
          payload: {
            buttons: [
              [
                {
                  type: 'callback',
                  text: '✅ Подтвердить оплату',
                  payload: `confirm_payment:calc:${order.id}`,
                },
                {
                  type: 'link',
                  text: 'Админка',
                  url: `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')}/admin/orders`,
                },
              ],
            ],
          },
        },
      ],
      disable_link_preview: true,
    })

    revalidatePath('/lk/orders')
    revalidatePath('/admin/orders')
    return order
  }

  async confirmOrderPaymentAdmin(orderId: number, adminUserId: number) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' }
    })

    await logAudit({
      actorUserId: adminUserId,
      action: 'order.admin.confirm_payment',
      target: String(orderId)
    })

    revalidatePath('/admin/orders')
  }
}
