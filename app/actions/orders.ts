'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
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
    return { error: parsed.error.errors[0].message }
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

  // Implementation of getClientFiles (placeholder)
  return []
}
