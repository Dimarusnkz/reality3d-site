'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { sendTelegramMessage } from '@/lib/telegram'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// --- Client Actions ---

export async function createOrder(data: {
  title: string;
  details: any;
  price?: number;
  csrfToken: string;
}) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(data.csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized' }
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: parseInt(session.userId),
        title: data.title,
        status: 'pending',
        price: data.price || 0,
        details: JSON.stringify(data.details, null, 2),
      },
      include: {
        user: true
      }
    })

    // Send Telegram Notification
    const safeTitle = escapeHtml(order.title || 'Без названия')
    const safeName = escapeHtml(order.user.name || 'Не указано')
    const safeEmail = escapeHtml(order.user.email)
    const safePhone = escapeHtml(order.user.phone || 'Не указан')
    const safeDetails = escapeHtml(JSON.stringify(data.details, null, 2))
    
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

    revalidatePath('/lk/orders')
    revalidatePath('/admin/orders')
    return { success: true, orderId: order.id }
  } catch (error) {
    console.error('Failed to create order:', error)
    return { error: 'Failed to create order' }
  }
}

export async function getClientOrders() {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !session.userId) {
    return []
  }

  return await prisma.order.findMany({
    where: {
      userId: parseInt(session.userId)
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getClientShopOrders() {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !session.userId) {
    return []
  }

  return await prisma.shopOrder.findMany({
    where: { userId: parseInt(session.userId) },
    select: {
      id: true,
      orderNo: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      paymentProvider: true,
      totalKopeks: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function getClientFiles() {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !session.userId) {
    return []
  }

  const userId = parseInt(session.userId)

  // 1. Get files from Order details
  const orders = await prisma.order.findMany({
    where: { userId },
    select: { id: true, title: true, details: true, createdAt: true }
  })

  const files: any[] = []

  orders.forEach(order => {
    try {
      const details = JSON.parse(order.details || '{}')
      if (details.files && Array.isArray(details.files)) {
        details.files.forEach((file: any) => {
          files.push({
            ...file,
            orderId: order.id,
            orderTitle: order.title,
            createdAt: order.createdAt
          })
        })
      }
    } catch (e) {
      // Ignore parse errors
    }
  })

  // 2. Get files from Chat attachments
  const chatSessions = await prisma.chatSession.findMany({
    where: { userId },
    include: {
      messages: {
        where: { attachments: { not: null } },
        select: { attachments: true, createdAt: true }
      }
    }
  })

  chatSessions.forEach(session => {
    session.messages.forEach(msg => {
      try {
        const attachments = JSON.parse(msg.attachments || '[]')
        if (Array.isArray(attachments)) {
          attachments.forEach((file: any) => {
            files.push({
              ...file,
              chatSessionId: session.id,
              orderId: session.orderId,
              createdAt: msg.createdAt
            })
          })
        }
      } catch (e) {
        // Ignore
      }
    })
  })

  // Sort by date descending
  return files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// --- Admin/Employee Actions ---

export async function getOrders() {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !['admin', 'manager', 'engineer', 'warehouse', 'delivery'].includes(session.role)) {
    return []
  }

  return await prisma.order.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { comments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getOrderDetails(orderId: number) {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session) return null

  // Security check: if user is not employee, they can only see their own order
  const isEmployee = ['admin', 'manager', 'engineer', 'warehouse', 'delivery'].includes(session.role);
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true, address: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      comments: {
        include: {
          user: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!order) return null;

  if (!isEmployee && order.userId !== parseInt(session.userId)) {
    return null; // Forbidden
  }

  return order;
}

export async function updateOrderStatus(orderId: number, status: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !['admin', 'manager', 'engineer', 'warehouse', 'delivery'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    })
    
    // Notify client? (Optional, maybe later)
    
    revalidatePath('/admin/orders')
    revalidatePath(`/lk/orders`) 
    return { success: true }
  } catch (error) {
    console.error('Failed to update status:', error)
    return { error: 'Failed to update status' }
  }
}

export async function updateOrderPrice(orderId: number, price: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { price }
    })
    revalidatePath('/admin/orders')
    revalidatePath(`/lk/orders`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update price:', error)
    return { error: 'Failed to update price' }
  }
}

export async function assignOrder(orderId: number, employeeId: number | null, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { assignedToId: employeeId }
    })
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to assign order:', error)
    return { error: 'Failed to assign order' }
  }
}

export async function updateOrderDeadline(orderId: number, deadline: Date | null, csrfToken: string) {
  const prisma = getPrisma()
    const csrf = await assertCsrfTokenValue(csrfToken || null)
    if (!csrf.ok) {
      return { error: csrf.error }
    }

    const session = await getSession()
    if (!session || !['admin', 'manager'].includes(session.role)) {
      return { error: 'Unauthorized' }
    }
  
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { deadline }
      })
      revalidatePath('/admin/orders')
      return { success: true }
    } catch (error) {
      console.error('Failed to update deadline:', error)
      return { error: 'Failed to update deadline' }
    }
}

export async function addOrderComment(orderId: number, text: string, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.orderComment.create({
      data: {
        orderId,
        userId: parseInt(session.userId),
        text
      }
    })
    revalidatePath('/admin/orders')
    revalidatePath('/lk/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to add comment:', error)
    return { error: 'Failed to add comment' }
  }
}

export async function deleteOrder(orderId: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // Delete related comments first (cascade usually handles this but good to be safe if not configured)
    await prisma.orderComment.deleteMany({ where: { orderId } })
    
    // Check for chat session and delete if exists
    const chatSession = await prisma.chatSession.findUnique({ where: { orderId } })
    if (chatSession) {
        await prisma.chatMessage.deleteMany({ where: { sessionId: chatSession.id } })
        await prisma.chatSession.delete({ where: { id: chatSession.id } })
    }

    await prisma.order.delete({
      where: { id: orderId }
    })
    revalidatePath('/admin/orders')
    revalidatePath('/lk/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete order:', error)
    return { error: 'Failed to delete order' }
  }
}

export async function updateOrderDetails(orderId: number, data: { title: string, details: any }, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        title: data.title,
        details: JSON.stringify(data.details, null, 2)
      }
    })
    revalidatePath('/admin/orders')
    revalidatePath('/lk/orders')
    return { success: true }
  } catch (error) {
    console.error('Failed to update order details:', error)
    return { error: 'Failed to update order details' }
  }
}

// Helper to get employees for assignment dropdown
export async function getEmployees() {
  const prisma = getPrisma()
    const session = await getSession()
    if (!session || !['admin', 'manager'].includes(session.role)) {
        return []
    }

    return await prisma.user.findMany({
        where: {
            role: {
                in: ['admin', 'manager', 'engineer', 'warehouse', 'delivery']
            }
        },
        select: { id: true, name: true, role: true }
    })
}
