'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { sendMaxMessage, verifyMaxToken } from '@/lib/max'

const prisma = new PrismaClient()

export async function sendTestMaxMessage() {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    // For now, just verify the token via /me
    const verified = await verifyMaxToken()
    
    if (verified) {
      // Also try to send a test message if subscribers exist
      const messageSent = await sendMaxMessage('Admin: Test MAX Message')
      return { success: true, message: messageSent ? 'Message sent' : 'Token verified' }
    } else {
      return { error: 'Failed to verify MAX token' }
    }
  } catch (error) {
    console.error('Failed to test MAX bot:', error)
    return { error: 'Failed to test bot' }
  }
}

export async function getMaxSubscribers() {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return []
  }

  return await prisma.maxSubscriber.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function addMaxSubscriber(chatId: string, name?: string) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  if (!chatId) {
    return { error: 'Chat ID is required' }
  }

  try {
    const subscriber = await prisma.maxSubscriber.create({
      data: {
        chatId: chatId.trim(),
        name: name?.trim()
      }
    })

    revalidatePath('/admin/max')
    return { success: true, subscriber }
  } catch (error) {
    console.error('Failed to add MAX subscriber:', error)
    return { error: 'Failed to add subscriber (possibly duplicate ID)' }
  }
}

export async function deleteMaxSubscriber(id: number) {
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.maxSubscriber.delete({
      where: { id }
    })

    revalidatePath('/admin/max')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete MAX subscriber:', error)
    return { error: 'Failed to delete subscriber' }
  }
}
