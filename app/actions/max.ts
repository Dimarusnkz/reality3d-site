'use server'

import { getPrisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendMaxMessage, verifyMaxToken } from '@/lib/max'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { requirePermission } from '@/lib/access'

export async function sendTestMaxMessage(csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return { error: access.error }

  try {
    // For now, just verify the token via /me
    const verified = await verifyMaxToken()
    
    if (verified) {
      // Also try to send a test message if subscribers exist
      const messageSent = await sendMaxMessage('Admin: Test MAX Message')
      return { success: true, message: messageSent ? 'Message sent' : 'Token verified (no recipients?)' }
    } else {
      return { error: 'Failed to verify MAX token' }
    }
  } catch (error) {
    console.error('Failed to test MAX bot:', error)
    return { error: 'Failed to test bot' }
  }
}

export async function setMaxWebhook(csrfToken: string) {
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return { error: access.error }

  const token = process.env.MAX_BOT_TOKEN
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!token || !siteUrl) {
    return { error: 'Bot token or Site URL not configured in environment' }
  }

  const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/max/webhook`
  const secret = process.env.MAX_WEBHOOK_SECRET || undefined

  try {
    const res = await fetch('https://platform-api.max.ru/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        update_types: ['message_callback', 'message_created', 'bot_started'],
        ...(secret ? { secret } : {}),
      }),
    })

    const data = await res.json().catch(() => null) as any
    if (res.ok) {
      revalidatePath('/admin/automation')
      return { success: true, message: data?.description || 'OK' }
    }

    return { error: data?.description || 'Failed to set webhook' }
  } catch (e) {
    console.error('Failed to set MAX webhook:', e)
    return { error: 'Failed to set webhook' }
  }
}

export async function getMaxSubscribers() {
  const prisma = getPrisma()
  const access = await requirePermission('roles.manage')
  if (!access.ok) return []

  return await prisma.maxSubscriber.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function addMaxSubscriber(chatId: string, csrfToken: string, name?: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return { error: access.error }

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

    revalidatePath('/admin/automation')
    return { success: true, subscriber }
  } catch (error) {
    console.error('Failed to add MAX subscriber:', error)
    return { error: 'Failed to add subscriber (possibly duplicate ID)' }
  }
}

export async function deleteMaxSubscriber(id: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return { error: access.error }

  try {
    await prisma.maxSubscriber.delete({
      where: { id }
    })

    revalidatePath('/admin/automation')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete MAX subscriber:', error)
    return { error: 'Failed to delete subscriber' }
  }
}
