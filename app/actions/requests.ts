'use server'

import { sendTelegramMessage } from '@/lib/telegram'
import { sendMaxMessage } from '@/lib/max'
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
    const notificationMessage = `
<b>🔔 Новая заявка с сайта</b>

👤 <b>Имя:</b> ${escapeHtml(name)}
📞 <b>Телефон:</b> ${escapeHtml(phone)}
📧 <b>Email:</b> ${escapeHtml(email)}

📝 <b>Описание:</b>
${escapeHtml(description)}
    `

    await sendTelegramMessage(notificationMessage)
    await sendMaxMessage(notificationMessage)

    return { success: true }
  } catch (error) {
    console.error('Error submitting request:', error)
    return { error: 'Ошибка при отправке заявки. Попробуйте позже.' }
  }
}
