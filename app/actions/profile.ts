'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export type ProfileState = {
  success?: boolean
  error?: string
  message?: string
}

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized', success: false }
  }

  const userId = parseInt(session.userId)
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  if (!email) {
    return { error: 'Email is required', success: false }
  }

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
        name,
        email,
        phone,
        address
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
  const session = await getSession()
  if (!session || !session.userId) {
    return { error: 'Unauthorized', success: false }
  }

  const userId = parseInt(session.userId)
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
