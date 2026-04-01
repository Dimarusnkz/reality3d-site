'use server'

import { getPrisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { assertCsrf } from '@/lib/csrf'
import { getClientIp } from '@/lib/request'
import { rateLimit } from '@/lib/rate-limit'

import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Имя: от 2 до 50 символов').max(50, 'Имя: от 2 до 50 символов').regex(/^[a-zA-Zа-яА-ЯёЁ\s-]+$/, 'Имя может содержать только буквы, пробелы и дефис').optional().nullable(),
  email: z.string().trim().email('Неверный email').max(100, 'Email слишком длинный'),
  phone: z.string().trim().regex(/^\+7\d{10}$/, 'Телефон: формат +7XXXXXXXXXX').optional().nullable(),
  address: z.string().trim().max(200, 'Адрес не более 200 символов').optional().nullable(),
  city: z.string().trim().max(100, 'Город не более 100 символов').optional().nullable(),
})

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
    return { error: 'Не авторизован', success: false }
  }

  const userId = parseInt(session.userId)
  
  const rawData = {
    name: formData.get('name') || null,
    email: formData.get('email'),
    phone: formData.get('phone') || null,
    address: formData.get('address') || null,
    city: formData.get('city') || null,
  }

  const normalizePhone = (input: any) => {
    if (typeof input !== 'string') return null
    const digits = input.replace(/\D/g, '')
    if (digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7'))) {
      return `+7${digits.slice(1)}`
    }
    if (digits.length === 10) {
      return `+7${digits}`
    }
    return input
  }

  if (rawData.phone) {
    rawData.phone = normalizePhone(rawData.phone)
  }

  const result = profileSchema.safeParse(rawData)
  if (!result.success) {
    return { error: result.error.issues[0].message, success: false }
  }

  const { name, email, phone, address, city } = result.data

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    if (existingUser && existingUser.id !== userId) {
      return { error: 'Email уже используется другим пользователем', success: false }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        address,
        city,
      }
    })

    revalidatePath('/lk/settings')
    return { success: true, message: 'Профиль успешно обновлен' }
  } catch (error) {
    console.error('Failed to update profile:', error)
    return { error: 'Не удалось обновить профиль', success: false }
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
    return { error: 'Не авторизован', success: false }
  }

  const userId = parseInt(session.userId)
  const ip = await getClientIp()
  const rl = await rateLimit(`auth:password_change:${ip}:${userId}`, 5, 10 * 60_000)
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
      where: { id: userId },
      select: { password: true }
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
