'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPrisma } from '@/lib/prisma'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { getUserAccessContext, hasPermission } from '@/lib/access'
import { getLogMeta } from '@/lib/shop/log-meta'
import { logAudit } from '@/lib/audit'
import { getMskDayKeyFromDate, getMskDayRangeUtc } from '@/lib/time-msk'
import { calcCashBalanceAt, calcCashDelta } from '@/lib/finance/reconciliation'
import { sendEmailViaSendGrid } from '@/lib/notifications/sendgrid'

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

const reconcileSchema = z.object({
  accountCode: z.enum(['online', 'office_cash', 'bank']),
  day: z.string().trim().optional().nullable(),
  actualRub: z.number().min(0).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
})

async function notifyDiscrepancy(input: { accountName: string; day: string; expectedKopeks: number; actualKopeks: number; diffKopeks: number }) {
  const toRaw = process.env.FINANCE_DISCREPANCY_EMAILS || ''
  const to = toRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const from = process.env.SENDGRID_FROM_EMAIL || ''
  if (to.length === 0 || !from) return

  const format = (k: number) => (k / 100).toFixed(2)

  await sendEmailViaSendGrid({
    to,
    from,
    subject: `Reality3D: расхождение кассы > 100₽ (${input.accountName}, ${input.day})`,
    text: `Сверка кассы.\n\nКасса: ${input.accountName}\nДень: ${input.day}\nОжидалось: ${format(input.expectedKopeks)} ₽\nФакт: ${format(input.actualKopeks)} ₽\nРасхождение: ${format(input.diffKopeks)} ₽\n`,
  })
}

export async function upsertCashReconciliation(input: unknown, csrfToken: string) {
  const prisma = getPrisma()
  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { ok: false as const, error: csrf.error }

  const access = await getUserAccessContext()
  if (!access) return { ok: false as const, error: 'Unauthorized' }

  const permitted = await hasPermission(access.userId, access.role, 'finance.reconcile.create')
  if (!permitted) return { ok: false as const, error: 'Unauthorized' }

  const parsed = reconcileSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Некорректные данные' }

  const dayKey = parsed.data.day || getMskDayKeyFromDate(new Date())
  const range = getMskDayRangeUtc(dayKey)
  if (!range) return { ok: false as const, error: 'Некорректная дата' }

  const account = await prisma.cashAccount.findUnique({ where: { code: parsed.data.accountCode }, select: { id: true, name: true } })
  if (!account) return { ok: false as const, error: 'Касса не найдена' }

  const cutoffAt = new Date()
  const end = cutoffAt.getTime() < range.end.getTime() ? cutoffAt : range.end

  const [openingKopeks, delta] = await Promise.all([
    calcCashBalanceAt(prisma, account.id, range.start),
    calcCashDelta(prisma, account.id, { start: range.start, end }),
  ])

  const expectedKopeks = openingKopeks + delta.delta
  const actualKopeks = parsed.data.actualRub == null ? null : Math.round(parsed.data.actualRub * 100)
  const diffKopeks = actualKopeks == null ? null : actualKopeks - expectedKopeks

  const existing = await prisma.cashReconciliation.findUnique({
    where: { accountId_day: { accountId: account.id, day: range.start } },
    select: { id: true, status: true, actualKopeks: true },
  })

  const meta = await getLogMeta()

  try {
    const rec =
      existing && existing.status === 'confirmed' && existing.actualKopeks != null && actualKopeks == null
        ? await prisma.cashReconciliation.update({
            where: { id: existing.id },
            data: { note: parsed.data.note || null },
            select: { id: true, expectedKopeks: true, actualKopeks: true, diffKopeks: true },
          })
        : await prisma.cashReconciliation.upsert({
            where: { accountId_day: { accountId: account.id, day: range.start } },
            create: {
              accountId: account.id,
              day: range.start,
              cutoffAt,
              openingKopeks,
              expectedKopeks,
              actualKopeks,
              diffKopeks,
              status: actualKopeks == null ? 'pending' : 'confirmed',
              createdByUserId: access.userId,
              note: parsed.data.note || null,
            },
            update: {
              cutoffAt,
              openingKopeks,
              expectedKopeks,
              ...(actualKopeks == null
                ? { status: 'pending' }
                : { actualKopeks, diffKopeks, status: 'confirmed', createdByUserId: access.userId }),
              note: parsed.data.note || null,
            },
            select: { id: true, expectedKopeks: true, actualKopeks: true, diffKopeks: true },
          })

    await logAudit({
      actorUserId: access.userId,
      action: 'finance.reconcile.upsert',
      target: rec.id,
      metadata: { accountCode: parsed.data.accountCode, day: dayKey, expectedKopeks, actualKopeks, diffKopeks, ipHash: meta.ipHash },
    })

    if (actualKopeks != null && diffKopeks != null && Math.abs(diffKopeks) > 10000) {
      await notifyDiscrepancy({ accountName: account.name, day: dayKey, expectedKopeks, actualKopeks, diffKopeks })
    }

    revalidatePath('/admin/finance')
    revalidatePath('/admin/finance/reconciliations')
    revalidatePath('/admin/logs')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Не удалось создать сверку' }
  }
}
