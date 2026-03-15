'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

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
