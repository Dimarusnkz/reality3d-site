import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getMskDayKeyFromDate, getMskDayRangeUtc } from "@/lib/time-msk";
import { calcCashBalanceAt, calcCashDelta } from "@/lib/finance/reconciliation";
import { logAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const provided = request.headers.get("x-cron-secret") || "";
  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const prisma = getPrisma();
  const now = new Date();
  const dayKey = getMskDayKeyFromDate(now);
  const range = getMskDayRangeUtc(dayKey);
  if (!range) return NextResponse.json({ ok: false }, { status: 400 });

  const cutoffAt = now;
  const end = cutoffAt.getTime() < range.end.getTime() ? cutoffAt : range.end;

  const accounts = await prisma.cashAccount.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });

  let updated = 0;
  for (const a of accounts) {
    const existing = await prisma.cashReconciliation.findUnique({
      where: { accountId_day: { accountId: a.id, day: range.start } },
      select: { id: true, status: true, actualKopeks: true },
    });

    if (existing && existing.status === "confirmed" && existing.actualKopeks != null) continue;

    const [openingKopeks, delta] = await Promise.all([
      calcCashBalanceAt(prisma, a.id, range.start),
      calcCashDelta(prisma, a.id, { start: range.start, end }),
    ]);

    const expectedKopeks = openingKopeks + delta.delta;

    await prisma.cashReconciliation.upsert({
      where: { accountId_day: { accountId: a.id, day: range.start } },
      create: {
        accountId: a.id,
        day: range.start,
        cutoffAt,
        openingKopeks,
        expectedKopeks,
        status: "pending",
        actualKopeks: null,
        diffKopeks: null,
        createdByUserId: null,
        note: "auto-22:00",
      },
      update: {
        cutoffAt,
        openingKopeks,
        expectedKopeks,
        status: "pending",
        note: "auto-22:00",
      },
    });
    updated += 1;
  }

  await logAudit({ actorUserId: null, action: "cron.finance.reconcile", target: dayKey, metadata: { updated } });
  return NextResponse.json({ ok: true, day: dayKey, updated });
}

