'use server'

import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// --- Types ---
export type ChatSessionWithDetails = {
  id: number
  status: string
  updatedAt: Date
  user: {
    id: number
    name: string | null
    email: string
  }
  order: {
    id: number
    status: string
  } | null
  unreadCount?: number
}

export type MessageWithSender = {
  id: number
  content: string
  isInternal: boolean
  attachments: string | null
  createdAt: Date
  sender: {
    id: number
    name: string | null
    role: string
  } | null
  isMine: boolean
}

// --- Actions ---

export async function getChats(): Promise<ChatSessionWithDetails[]> {
  const session = await getSession()
  if (!session) return []

  const { userId, role } = session

  let whereClause: any = {}

  if (role === 'user' || role === 'client') {
    whereClause = { userId: parseInt(userId) }
  } else {
    // Admin, Manager, Engineer, etc. see all chats for now
    // TODO: Implement filtering for Engineer/Warehouse based on assignments
    whereClause = {}
  }

  const chats = await prisma.chatSession.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      order: {
        select: { id: true, status: true }
      },
      messages: {
        where: {
            read: false,
            NOT: {
                senderId: parseInt(userId) // Don't count own messages
            }
        },
        select: { id: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return chats.map(chat => ({
    id: chat.id,
    status: chat.status,
    updatedAt: chat.updatedAt,
    user: chat.user,
    order: chat.order,
    unreadCount: chat.messages.length
  }))
}

export async function getChatMessages(sessionId: number): Promise<MessageWithSender[]> {
  const session = await getSession()
  if (!session) return []

  const { userId, role } = session

  // Verify access
  const chat = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { userId: true }
  })

  if (!chat) return []

  // Client can only see their own chat
  if ((role === 'user' || role === 'client') && chat.userId !== parseInt(userId)) {
    return []
  }

  // Filter internal messages for clients
  const whereClause: any = { sessionId }
  if (role === 'user' || role === 'client') {
    whereClause.isInternal = false
  }

  const messages = await prisma.chatMessage.findMany({
    where: whereClause,
    include: {
      sender: {
        select: { id: true, name: true, role: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  // Mark as read (simplified)
  // In a real app, we'd mark specific messages as read
  // await prisma.chatMessage.updateMany({
  //   where: { sessionId, read: false, NOT: { senderId: parseInt(userId) } },
  //   data: { read: true }
  // })

  return messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    isInternal: msg.isInternal,
    attachments: msg.attachments,
    createdAt: msg.createdAt,
    sender: msg.sender,
    isMine: msg.senderId === parseInt(userId)
  }))
}

export async function sendMessage(sessionId: number, content: string, isInternal: boolean = false, attachments: string[] = []) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const { userId, role } = session

  // Verify access
  const chat = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { userId: true }
  })

  if (!chat) return { error: 'Chat not found' }

  if ((role === 'user' || role === 'client') && chat.userId !== parseInt(userId)) {
    return { error: 'Forbidden' }
  }

  // Clients cannot send internal messages
  if ((role === 'user' || role === 'client') && isInternal) {
    return { error: 'Forbidden' }
  }

  try {
    await prisma.chatMessage.create({
      data: {
        sessionId,
        senderId: parseInt(userId),
        content,
        isInternal,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
      }
    })

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    })

    revalidatePath('/admin/chat')
    revalidatePath('/lk/chat')
    return { success: true }
  } catch (error) {
    console.error('Error sending message:', error)
    return { error: 'Failed to send message' }
  }
}

export async function createChatSession(orderId?: number, targetUserId?: number) {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    const { userId, role } = session
    let chatUserId = parseInt(userId)

    if (targetUserId) {
        // Only admin/manager can create chat for others
        if (role !== 'admin' && role !== 'manager') {
            return { error: 'Forbidden' }
        }
        chatUserId = targetUserId
    }

    try {
        const newChat = await prisma.chatSession.create({
            data: {
                userId: chatUserId,
                orderId: orderId || null,
                status: 'active'
            }
        })
        
        // Add initial system message
        await prisma.chatMessage.create({
            data: {
                sessionId: newChat.id,
                content: 'Чат создан. Менеджер скоро подключится к вам.',
                senderId: null // System message
            }
        })

        revalidatePath('/lk/chat')
        return { success: true, chatId: newChat.id }
    } catch (error) {
        console.error('Error creating chat:', error)
        return { error: 'Failed to create chat' }
    }
}
