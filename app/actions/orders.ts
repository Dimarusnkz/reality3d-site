'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { sendTelegramMessage } from '@/lib/telegram'

const prisma = new PrismaClient()

// --- Client Actions ---

export async function createOrder(data: {
  title: string;
  details: any;
}) {
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
        price: 0, // Price is set by admin later
        details: JSON.stringify(data.details, null, 2),
      },
      include: {
        user: true
      }
    })

    // Send Telegram Notification
    const message = `
<b>📦 Новый заказ #${order.id}</b>

📝 <b>Название:</b> ${order.title || 'Без названия'}
👤 <b>Клиент:</b> ${order.user.name || 'Не указано'} (${order.user.email})
📱 <b>Телефон:</b> ${order.user.phone || 'Не указан'}

📝 <b>Детали заказа:</b>
<pre>${JSON.stringify(data.details, null, 2)}</pre>
    `

    await sendTelegramMessage(message)

    revalidatePath('/lk/orders')
    revalidatePath('/admin/orders')
    return { success: true, orderId: order.id }
  } catch (error) {
    console.error('Failed to create order:', error)
    return { error: 'Failed to create order' }
  }
}

export async function getClientOrders() {
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

// --- Admin/Employee Actions ---

export async function getOrders() {
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

export async function updateOrderStatus(orderId: number, status: string) {
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

export async function updateOrderPrice(orderId: number, price: number) {
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

export async function assignOrder(orderId: number, employeeId: number | null) {
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

export async function updateOrderDeadline(orderId: number, deadline: Date | null) {
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

export async function addOrderComment(orderId: number, text: string) {
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

export async function deleteOrder(orderId: number) {
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

export async function updateOrderDetails(orderId: number, data: { title: string, details: any }) {
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
