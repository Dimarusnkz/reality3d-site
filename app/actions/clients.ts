'use server'

import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { assertCsrfTokenValue } from '@/lib/csrf'

export type ClientWithStats = {
  id: number
  email: string
  name: string | null
  phone: string | null
  address: string | null
  role: string
  createdAt: Date
  activeOrdersCount: number
  chatId: number | null
}

export async function getClients(): Promise<ClientWithStats[]> {
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    return []
  }

  // Fetch users with role 'user' or 'client'
  // Also fetching order stats
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['user', 'client']
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      role: true,
      createdAt: true,
      orders: {
        where: {
          status: {
            notIn: ['completed', 'cancelled']
          }
        },
        select: { id: true }
      },
      chatSessions: {
        select: { id: true },
        take: 1,
        orderBy: { updatedAt: 'desc' }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    role: user.role,
    createdAt: user.createdAt,
    activeOrdersCount: user.orders.length,
    chatId: user.chatSessions[0]?.id || null
  }))
}

export async function deleteClient(id: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // We need to delete all related data manually because cascade is not set in schema
    await prisma.$transaction(async (tx) => {
      // 1. Delete comments on user's orders and user's own comments
      await tx.orderComment.deleteMany({
        where: {
          OR: [
            { userId: id },
            { order: { userId: id } }
          ]
        }
      })

      // 2. Delete reviews
      await tx.review.deleteMany({
        where: { userId: id }
      })

      // 3. Delete chat messages in user's sessions and sent by user
      await tx.chatMessage.deleteMany({
        where: {
          OR: [
            { senderId: id },
            { session: { userId: id } },
            { session: { order: { userId: id } } }
          ]
        }
      })

      // 4. Delete chat sessions
      await tx.chatSession.deleteMany({
        where: {
          OR: [
            { userId: id },
            { order: { userId: id } }
          ]
        }
      })

      // 5. Delete orders
      await tx.order.deleteMany({
        where: { userId: id }
      })

      // 6. Delete the user
      await tx.user.delete({
        where: { id }
      })
    })

    revalidatePath('/admin/clients')
    return { success: true }
  } catch (error) {
    console.error('Error deleting client:', error)
    return { error: 'Failed to delete client with history' }
  }
}

export async function updateClient(
  id: number,
  data: { name: string; phone: string; email: string; address: string; password?: string },
  csrfToken: string
) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  try {
    // Check if email is already taken by another user
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: id }
        }
      })
      
      if (existingUser) {
        return { error: 'Email already in use' }
      }
    }

    const updateData: any = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address
    }

    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/admin/clients')
    return { success: true }
  } catch (error) {
    console.error('Error updating client:', error)
    return { error: 'Failed to update client' }
  }
}
