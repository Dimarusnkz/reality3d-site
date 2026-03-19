'use server'

import { getPrisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { sendTelegramMessage } from '@/lib/telegram'
import { assertCsrfTokenValue } from '@/lib/csrf'

export async function sendTestTelegramMessage(csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

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
  const prisma = getPrisma()
  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return []
  }

  return await prisma.telegramSubscriber.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function addTelegramSubscriber(chatId: string, csrfToken: string, name?: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

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

export async function deleteTelegramSubscriber(id: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

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

export async function setTelegramWebhook(csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || !['admin', 'manager'].includes(session.role)) {
    return { error: 'Unauthorized' }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!token || !siteUrl) {
    return { error: 'Bot token or Site URL not configured in environment' }
  }

  const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/telegram/webhook`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
    const data = await response.json();

    if (data.ok) {
      return { success: true, message: data.description }
    } else {
      return { error: data.description || 'Failed to set webhook' }
    }
  } catch (error) {
    console.error('Failed to set telegram webhook:', error)
    return { error: 'Failed to set webhook' }
  }
}
