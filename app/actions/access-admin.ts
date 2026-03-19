'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { requirePermission } from '@/lib/access'
import { logAudit } from '@/lib/audit'

const roleSchema = z.object({
  userId: z.number().int().positive(),
  role: z.string().trim().min(2).max(40),
})

export async function setUserRole(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return access

  const parsed = roleSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role } })
    await logAudit({
      actorUserId: access.userId,
      action: 'access.role.set',
      target: String(parsed.data.userId),
      metadata: { role: parsed.data.role },
    })
    revalidatePath('/admin/roles')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось изменить роль' }
  }
}

const groupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().nullable(),
})

export async function createAccessGroup(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return access

  const parsed = groupSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    const group = await prisma.accessGroup.create({
      data: { name: parsed.data.name, description: parsed.data.description || null, createdByUserId: access.userId },
      select: { id: true },
    })
    await logAudit({ actorUserId: access.userId, action: 'access.group.create', target: String(group.id), metadata: { name: parsed.data.name } })
    revalidatePath('/admin/roles')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось создать группу' }
  }
}

const userGroupSchema = z.object({
  userId: z.number().int().positive(),
  groupId: z.number().int().positive(),
  action: z.enum(['add', 'remove']),
})

export async function updateUserGroup(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return access

  const parsed = userGroupSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    if (parsed.data.action === 'add') {
      await prisma.userAccessGroup.upsert({
        where: { userId_groupId: { userId: parsed.data.userId, groupId: parsed.data.groupId } },
        create: { userId: parsed.data.userId, groupId: parsed.data.groupId },
        update: {},
      })
      await logAudit({ actorUserId: access.userId, action: 'access.user.group.add', target: String(parsed.data.userId), metadata: { groupId: parsed.data.groupId } })
    } else {
      await prisma.userAccessGroup.deleteMany({ where: { userId: parsed.data.userId, groupId: parsed.data.groupId } })
      await logAudit({ actorUserId: access.userId, action: 'access.user.group.remove', target: String(parsed.data.userId), metadata: { groupId: parsed.data.groupId } })
    }

    revalidatePath('/admin/roles')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось обновить группу' }
  }
}

const userPermissionSchema = z.object({
  userId: z.number().int().positive(),
  permissionKey: z.string().trim().min(2).max(120),
  allow: z.boolean().optional().nullable(),
})

export async function setUserPermissionOverride(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return access

  const parsed = userPermissionSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    if (parsed.data.allow == null) {
      await prisma.userAccessPermission.deleteMany({ where: { userId: parsed.data.userId, permissionKey: parsed.data.permissionKey } })
    } else {
      await prisma.userAccessPermission.upsert({
        where: { userId_permissionKey: { userId: parsed.data.userId, permissionKey: parsed.data.permissionKey } },
        create: { userId: parsed.data.userId, permissionKey: parsed.data.permissionKey, allow: parsed.data.allow },
        update: { allow: parsed.data.allow },
      })
    }

    await logAudit({
      actorUserId: access.userId,
      action: 'access.user.permission.set',
      target: String(parsed.data.userId),
      metadata: { permissionKey: parsed.data.permissionKey, allow: parsed.data.allow ?? null },
    })

    revalidatePath('/admin/roles')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось изменить права' }
  }
}

const groupPermissionSchema = z.object({
  groupId: z.number().int().positive(),
  permissionKey: z.string().trim().min(2).max(120),
  action: z.enum(['add', 'remove']),
})

export async function updateGroupPermission(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return access

  const parsed = groupPermissionSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  try {
    if (parsed.data.action === 'add') {
      await prisma.accessGroupPermission.upsert({
        where: { groupId_permissionKey: { groupId: parsed.data.groupId, permissionKey: parsed.data.permissionKey } },
        create: { groupId: parsed.data.groupId, permissionKey: parsed.data.permissionKey },
        update: {},
      })
    } else {
      await prisma.accessGroupPermission.deleteMany({
        where: { groupId: parsed.data.groupId, permissionKey: parsed.data.permissionKey },
      })
    }

    await logAudit({
      actorUserId: access.userId,
      action: `access.group.permission.${parsed.data.action}`,
      target: String(parsed.data.groupId),
      metadata: { permissionKey: parsed.data.permissionKey },
    })

    revalidatePath('/admin/roles')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось обновить права группы' }
  }
}

export async function deleteAccessGroup(groupId: number, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await requirePermission('roles.manage')
  if (!access.ok) return access

  try {
    await prisma.$transaction([
      prisma.userAccessGroup.deleteMany({ where: { groupId } }),
      prisma.accessGroupPermission.deleteMany({ where: { groupId } }),
      prisma.accessGroup.delete({ where: { id: groupId } }),
    ])

    await logAudit({
      actorUserId: access.userId,
      action: 'access.group.delete',
      target: String(groupId),
    })

    revalidatePath('/admin/roles')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось удалить группу' }
  }
}

