'use server'

import { sendTelegramMessage } from '@/lib/telegram'
import { sendMaxMessage } from '@/lib/max'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { assertCsrf } from '@/lib/csrf'
import { getClientIp } from '@/lib/request'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const requestSchema = z.object({
  name: z.string().min(1).max(20),
  phone: z.string().min(1).max(12).regex(/^\d+$/),
  email: z.string().min(3).max(30).email().regex(/^[a-zA-Z0-9@._-]+$/),
  description: z.string().min(1).max(200),
});

export async function submitRequest(formData: FormData) {
  const csrf = await assertCsrf(formData)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const ip = await getClientIp()
  const rl = rateLimit(`request:submit:${ip}`, 10, 60 * 60_000)
  if (!rl.ok) {
    return { error: 'Слишком много заявок. Попробуйте позже.' }
  }

  const parsed = requestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: 'Проверьте корректность заполнения формы' }
  }

  const { name, phone, email, description } = parsed.data

  try {
    // 1. Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Create new user (lead)
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10)
      user = await prisma.user.create({
        data: {
          email,
          name,
          phone,
          password: hashedPassword,
          role: 'user', // Default role
        }
      })
    }

    // 2. Create Chat Session for the request
    // Check if active session exists, if not create one
    // But since this is a "request", maybe create a new session or append to existing?
    // Let's check for existing active session
    let session = await prisma.chatSession.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    })

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: user.id,
          status: 'active'
        }
      })
    }

    // 3. Add message to chat (as if from user)
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        senderId: user.id,
        content: `ЗАЯВКА С САЙТА:\n${description}\n\nТелефон: ${phone}`,
        isInternal: false
      }
    })

    // 4. Send Notifications (Telegram & MAX)
    const notificationMessage = `
<b>🔔 Новая заявка с сайта</b>

👤 <b>Имя:</b> ${escapeHtml(name)}
📞 <b>Телефон:</b> ${escapeHtml(phone)}
📧 <b>Email:</b> ${escapeHtml(email)}

📝 <b>Описание:</b>
${escapeHtml(description)}

🔗 <a href="https://reality3d.ru/admin/chat?sessionId=${encodeURIComponent(session.id.toString())}">Перейти в чат</a>
    `

    await sendTelegramMessage(notificationMessage)
    await sendMaxMessage(notificationMessage)

    return { success: true }
  } catch (error) {
    console.error('Error submitting request:', error)
    return { error: 'Ошибка при отправке заявки. Попробуйте позже.' }
  }
}
