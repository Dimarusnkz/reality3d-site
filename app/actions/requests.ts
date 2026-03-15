'use server'

import { PrismaClient } from '@prisma/client'
import { sendTelegramMessage } from '@/lib/telegram'
import { sendMaxMessage } from '@/lib/max'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function submitRequest(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const description = formData.get('description') as string

  if (!name || !phone || !email || !description) {
    return { error: 'Все поля обязательны' }
  }

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

👤 <b>Имя:</b> ${name}
📞 <b>Телефон:</b> ${phone}
📧 <b>Email:</b> ${email}

📝 <b>Описание:</b>
${description}

🔗 <a href="https://reality3d.ru/admin/chat?sessionId=${session.id}">Перейти в чат</a>
    `

    await sendTelegramMessage(notificationMessage)
    await sendMaxMessage(notificationMessage)

    return { success: true }
  } catch (error) {
    console.error('Error submitting request:', error)
    return { error: 'Ошибка при отправке заявки. Попробуйте позже.' }
  }
}
