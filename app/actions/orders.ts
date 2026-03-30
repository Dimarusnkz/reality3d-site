'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { logAudit } from '@/lib/audit'
import { OrderService } from '@/lib/services/order-service'
import { createOrderSchema } from '@/lib/schemas/order'

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

  const parsed = createOrderSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const orderService = new OrderService(prisma)

  try {
    const order = await orderService.createOrder(parsed.data, parseInt(session.userId))
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
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      createdAt: true,
      updatedAt: true,
      deadline: true,
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

export async function confirmOrderPaymentAdmin(orderId: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { error: csrf.error }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const orderService = new OrderService(prisma)

  try {
    await orderService.confirmOrderPaymentAdmin(orderId, parseInt(session.userId))
    return { success: true }
  } catch (error) {
    console.error('Failed to confirm payment:', error)
    return { error: 'Failed to confirm payment' }
  }
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

    await logAudit({
      actorUserId: parseInt(session.userId, 10),
      action: 'orders.status.update',
      target: String(orderId),
      metadata: { status },
    })

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
    await logAudit({
      actorUserId: parseInt(session.userId, 10),
      action: 'orders.price.update',
      target: String(orderId),
      metadata: { price },
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
    await logAudit({
      actorUserId: parseInt(session.userId, 10),
      action: 'orders.assign.update',
      target: String(orderId),
      metadata: { assignedToId: employeeId },
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
      await logAudit({
        actorUserId: parseInt(session.userId, 10),
        action: 'orders.deadline.update',
        target: String(orderId),
        metadata: { deadline: deadline ? deadline.toISOString() : null },       
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
    await logAudit({
      actorUserId: parseInt(session.userId, 10),
      action: 'orders.comment.create',
      target: String(orderId),
      metadata: { length: text.length },
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
    await logAudit({
      actorUserId: parseInt(session.userId, 10),
      action: 'orders.delete',
      target: String(orderId),
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
    await logAudit({
      actorUserId: parseInt(session.userId, 10),
      action: 'orders.details.update',
      metadata: { title: data.title },
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
