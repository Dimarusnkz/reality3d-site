'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { getUserAccessContext, hasPermission } from '@/lib/access'
import { getLogMeta } from '@/lib/shop/log-meta'
import { logAudit } from '@/lib/audit'

const createEntrySchema = z.object({
  accountCode: z.enum(['online', 'office_cash', 'bank']),
  direction: z.enum(['income', 'expense', 'transfer', 'correction']),
  entryType: z.string().trim().min(1).max(80),
  amountRub: z.number().min(0.01),
  description: z.string().trim().max(500).optional().nullable(),
  shopOrderId: z.string().trim().uuid().optional().nullable(),
})

export async function createCashEntry(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }

  const permitted = await hasPermission(access.userId, access.role, 'finance.entry.create')
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }

  const parsed = createEntrySchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  if (access.role === 'manager' && parsed.data.accountCode !== 'office_cash') {
    return { ok: false as const, error: 'Недостаточно прав для этой кассы' }
  }

  const account = await prisma.cashAccount.findUnique({ where: { code: parsed.data.accountCode }, select: { id: true } })
  if (!account) return { ok: false as const, error: 'Касса не найдена' }

  const amountKopeks = Math.round(parsed.data.amountRub * 100)
  const meta = await getLogMeta()

  try {
    const entry = await prisma.cashEntry.create({
      data: {
        accountId: account.id,
        direction: parsed.data.direction,
        entryType: parsed.data.entryType,
        amountKopeks,
        currency: 'RUB',
        description: parsed.data.description || null,
        status: 'confirmed',
        shopOrderId: parsed.data.shopOrderId || null,
        createdByUserId: access.userId,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
      },
      select: { id: true },
    })

    await logAudit({
      actorUserId: access.userId,
      action: 'finance.cash_entry.create',
      target: entry.id,
      metadata: { accountCode: parsed.data.accountCode, direction: parsed.data.direction, amountKopeks },
    })

    revalidatePath('/admin/finance')
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось создать операцию' }
  }
}

