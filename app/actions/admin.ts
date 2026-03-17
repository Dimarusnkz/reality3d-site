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
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!name || !email || !password || !role) {
    return { error: 'Missing required fields' }
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
    })

    await logAudit({ actorUserId: parseInt(session.userId, 10), action: 'admin.user.create', target: email, metadata: { role } })

    revalidatePath('/admin/team')
    return { success: true }
  } catch (error) {
    console.error('Error creating user:', error)
    return { error: 'Failed to create user' }
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
    return { error: 'Unauthorized' }
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
    return { error: 'Failed to delete user' }
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
      return { error: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const role = formData.get('role') as string
    const password = formData.get('password') as string

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
            data
        })
        await logAudit({ actorUserId: parseInt(session.userId, 10), action: 'admin.user.update', target: userId.toString(), metadata: { role } })
        revalidatePath('/admin/team')
        return { success: true }
    } catch (error) {
        console.error('Error updating user:', error)
        return { error: 'Failed to update user' }
    }
}
