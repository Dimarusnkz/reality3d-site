'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/session'
import { getPrisma } from '@/lib/prisma'
import { assertCsrf } from '@/lib/csrf'
import { logAudit } from '@/lib/audit'

export async function createUser(formData: FormData) {
  const prisma = getPrisma()
  const csrf = await assertCsrf(formData)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Не авторизован' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!name || !email || !password || !role) {
    return { error: 'Заполните все обязательные поля' }
  }

  if (name.length < 2 || name.length > 50) {
    return { error: 'Имя должно быть от 2 до 50 символов' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 100) {
    return { error: 'Некорректный email' }
  }
  if (password.length < 6 || password.length > 100) {
    return { error: 'Пароль должен быть от 6 до 100 символов' }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: { id: true }
    })

    await logAudit({ actorUserId: parseInt(session.userId, 10), action: 'admin.user.create', target: email, metadata: { role } })

    revalidatePath('/admin/team')
    return { success: true }
  } catch (error) {
    console.error('Error creating user:', error)
    return { error: 'Не удалось создать пользователя' }
  }
}

export async function deleteUser(userId: number, csrfToken: string) {
  const prisma = getPrisma()
  const fd = new FormData()
  fd.set('csrf_token', csrfToken)
  const csrf = await assertCsrf(fd)
  if (!csrf.ok) {
    return { error: csrf.error }
  }

  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { error: 'Не авторизован' }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    await logAudit({ actorUserId: parseInt(session.userId, 10), action: 'admin.user.delete', target: userId.toString() })
    revalidatePath('/admin/team')
    return { success: true }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { error: 'Не удалось удалить пользователя' }
  }
}

export async function updateUser(userId: number, formData: FormData) {
    const prisma = getPrisma()
    const csrf = await assertCsrf(formData)
    if (!csrf.ok) {
      return { error: csrf.error }
    }

    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return { error: 'Не авторизован' }
    }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const role = formData.get('role') as string
    const password = formData.get('password') as string

    if (name && (name.length < 2 || name.length > 50)) {
      return { error: 'Имя должно быть от 2 до 50 символов' }
    }
    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 100)) {
      return { error: 'Некорректный email' }
    }
    if (password && (password.length < 6 || password.length > 100)) {
      return { error: 'Пароль должен быть от 6 до 100 символов' }
    }

    try {
        const data: any = {
            name,
            email,
            role
        }

        if (password && password.trim() !== '') {
            data.password = await bcrypt.hash(password, 10)
        }

        await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true }
        })
        await logAudit({ actorUserId: parseInt(session.userId, 10), action: 'admin.user.update', target: userId.toString(), metadata: { role } })
        revalidatePath('/admin/team')
        return { success: true }
    } catch (error) {
        console.error('Error updating user:', error)
        return { error: 'Не удалось обновить пользователя' }
    }
}
