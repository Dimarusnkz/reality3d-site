'use server'

import { getPrisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { assertCsrf } from '@/lib/csrf'
import { getClientIp } from '@/lib/request'
import { rateLimit } from '@/lib/rate-limit'

export type ProfileState = {
  success?: boolean
  error?: string
  message?: string
}

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const prisma = getPrisma()
  const csrf = await assertCsrf(formData)
  if (!csrf.ok) {
    return { error: csrf.error, success: false }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized', success: false }
  }

  const userId = parseInt(session.userId)
  const name = String(formData.get('name') || '')
  const email = String(formData.get('email') || '')
  const phone = String(formData.get('phone') || '')
  const address = String(formData.get('address') || '')
  const city = String(formData.get('city') || '')

  const PHONE_RE = /^\+7\d{10}$/
  const NAME_RE = /^[A-Za-zА-Яа-яЁё\s\-]{2,50}$/
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  const normalizePhone = (input: string) => {
    const raw = input.trim()
    const digits = raw.replace(/[^\d+]/g, '')
    let onlyDigits = digits.startsWith('+') ? `+${digits.slice(1).replace(/\D/g, '')}` : digits.replace(/\D/g, '')
    if (onlyDigits.startsWith('+7')) {
      const d = onlyDigits.slice(2).replace(/\D/g, '').slice(0, 10)
      return `+7${d}`
    }
    const d = onlyDigits.replace(/\D/g, '')
    if (d.startsWith('8')) return `+7${d.slice(1).slice(0, 10)}`
    if (d.startsWith('7')) return `+7${d.slice(1).slice(0, 10)}`
    if (d.startsWith('9')) return `+7${d.slice(0, 10)}`
    return raw.startsWith('+') ? `+${d.slice(0, 11)}` : d.slice(0, 11)
  }

  const emailTrim = email.trim()
  const nameTrim = name.trim()
  const phoneNorm = phone.trim() ? normalizePhone(phone) : ''

  if (!emailTrim) return { error: 'Email is required', success: false }
  if (emailTrim.length > 100 || !EMAIL_RE.test(emailTrim)) return { error: 'Неверный email', success: false }
  if (nameTrim && !NAME_RE.test(nameTrim)) return { error: 'Имя: только буквы (2–50 символов)', success: false }
  if (phoneNorm && !PHONE_RE.test(phoneNorm)) return { error: 'Телефон: формат +7XXXXXXXXXX', success: false }
  if (address.length > 200) return { error: 'Адрес не более 200 символов', success: false }
  if (city.length > 100) return { error: 'Город не более 100 символов', success: false }

  try {
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.id !== userId) {
      return { error: 'Email is already in use', success: false }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: nameTrim || null,
        email: emailTrim,
        phone: phoneNorm || null,
        address: address.trim() || null,
        city: city.trim() || null,
      }
    })

    revalidatePath('/lk/settings')
    return { success: true, message: 'Профиль успешно обновлен' }
  } catch (error) {
    console.error('Failed to update profile:', error)
    return { error: 'Failed to update profile', success: false }
  }
}

export async function updatePassword(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const prisma = getPrisma()
  const csrf = await assertCsrf(formData)
  if (!csrf.ok) {
    return { error: csrf.error, success: false }
  }

  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized', success: false }
  }

  const userId = parseInt(session.userId)
  const ip = await getClientIp()
  const rl = rateLimit(`auth:password_change:${ip}:${userId}`, 5, 10 * 60_000)
  if (!rl.ok) {
    return { error: 'Слишком много попыток. Подожди и попробуй снова.', success: false }
  }
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Все поля обязательны', success: false }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Новые пароли не совпадают', success: false }
  }

  if (newPassword.length < 6) {
    return { error: 'Пароль должен быть не менее 6 символов', success: false }
  }

  if (newPassword.length > 25) {
    return { error: 'Пароль не должен превышать 25 символов', success: false }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return { error: 'Пользователь не найден', success: false }
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return { error: 'Текущий пароль указан неверно', success: false }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return { success: true, message: 'Пароль успешно изменен' }
  } catch (error) {
    console.error('Failed to update password:', error)
    return { error: 'Ошибка при смене пароля', success: false }
  }
}
