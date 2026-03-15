'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { sendTelegramMessage } from '@/lib/telegram'

const prisma = new PrismaClient()

export async function sendTestTelegramMessage() {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    const success = await sendTelegramMessage('Админ: TEST WORK BOT')
    
    if (success) {
      return { success: true }
    } else {
      return { error: 'Failed to send test message' }
    }
  } catch (error) {
    console.error('Failed to send test telegram message:', error)
    return { error: 'Failed to send test message' }
  }
}

export async function getTelegramSubscribers() {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return []
  }

  return await prisma.telegramSubscriber.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function addTelegramSubscriber(chatId: string, name?: string) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  if (!chatId) {
    return { error: 'Chat ID is required' }
  }

  try {
    const subscriber = await prisma.telegramSubscriber.create({
      data: {
        chatId: chatId.trim(),
        name: name?.trim()
      }
    })

    revalidatePath('/admin/settings')
    return { success: true, subscriber }
  } catch (error) {
    console.error('Failed to add telegram subscriber:', error)
    return { error: 'Failed to add subscriber (possibly duplicate ID)' }
  }
}

export async function deleteTelegramSubscriber(id: number) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.telegramSubscriber.delete({
      where: { id }
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete telegram subscriber:', error)
    return { error: 'Failed to delete subscriber' }
  }
}
