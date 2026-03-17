import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { getMskDayKeyFromDate } from "@/lib/time-msk";
import { ReconciliationsClient } from "./reconciliations-client";

export default async function AdminFinanceReconciliationsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "finance.view");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const [accounts, rows] = await Promise.all([
    prisma.cashAccount.findMany({ where: { isActive: true }, select: { code: true, name: true }, orderBy: { id: "asc" } }),
    prisma.cashReconciliation.findMany({
      select: {
        id: true,
        day: true,
        cutoffAt: true,
        openingKopeks: true,
        expectedKopeks: true,
        actualKopeks: true,
        diffKopeks: true,
        status: true,
        note: true,
        account: { select: { code: true, name: true } },
      },
      orderBy: [{ day: "desc" }, { cutoffAt: "desc" }],
      take: 200,
    }),
  ]);

  const today = getMskDayKeyFromDate(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Сверки кассы</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/finance" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Касса
          </Link>
          <Link href="/admin/finance/reports" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Отчёты
          </Link>
        </div>
      </div>

      <ReconciliationsClient
        today={today}
        accounts={accounts as any}
        rows={rows.map((r) => ({
          id: r.id,
          day: r.day.toISOString().slice(0, 10),
          cutoffAt: r.cutoffAt.toISOString(),
          accountCode: r.account.code as any,
          accountName: r.account.name,
          openingKopeks: r.openingKopeks,
          expectedKopeks: r.expectedKopeks,
          actualKopeks: r.actualKopeks,
          diffKopeks: r.diffKopeks,
          status: r.status,
          note: r.note,
        }))}
      />
    </div>
  );
}

