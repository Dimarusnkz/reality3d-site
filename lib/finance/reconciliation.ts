import type { PrismaClient } from '@prisma/client'

async function sumByDirection(prisma: PrismaClient, input: { accountId: number; direction: 'income' | 'expense'; from?: Date; to?: Date }) {
  const res = await prisma.cashEntry.aggregate({
    where: {
      accountId: input.accountId,
      direction: input.direction,
      ...(input.from || input.to ? { createdAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lt: input.to } : {}) } } : {}),
    },
    _sum: { amountKopeks: true },
  })
  return res._sum.amountKopeks ?? 0
}

export async function calcCashBalanceAt(prisma: PrismaClient, accountId: number, at: Date) {
  const [income, expense] = await Promise.all([
    sumByDirection(prisma, { accountId, direction: 'income', to: at }),
    sumByDirection(prisma, { accountId, direction: 'expense', to: at }),
  ])
  return income - expense
}

export async function calcCashDelta(prisma: PrismaClient, accountId: number, range: { start: Date; end: Date }) {
  const [income, expense] = await Promise.all([
    sumByDirection(prisma, { accountId, direction: 'income', from: range.start, to: range.end }),
    sumByDirection(prisma, { accountId, direction: 'expense', from: range.start, to: range.end }),
  ])
  return { income, expense, delta: income - expense }
}

