import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { FinanceClient } from "./finance-client";
import { formatRub } from "@/lib/shop/money";

export default async function AdminFinancePage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "finance.view");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const [accounts, entries] = await Promise.all([
    prisma.cashAccount.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true }, orderBy: { id: "asc" } }),
    prisma.cashEntry.findMany({
      select: {
        id: true,
        createdAt: true,
        direction: true,
        entryType: true,
        amountKopeks: true,
        description: true,
        account: { select: { code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const sums = await prisma.cashEntry.groupBy({
    by: ["accountId", "direction"],
    where: {
      status: "confirmed",
      accountId: { in: accounts.map((a) => a.id) },
      direction: { in: ["income", "expense"] },
    },
    _sum: { amountKopeks: true },
  });

  const byAccount = new Map<number, { income: number; expense: number }>();
  for (const s of sums) {
    const current = byAccount.get(s.accountId) || { income: 0, expense: 0 };
    const v = s._sum.amountKopeks ?? 0;
    if (s.direction === "income") current.income += v;
    if (s.direction === "expense") current.expense += v;
    byAccount.set(s.accountId, current);
  }

  const mainCodes = ["office_cash", "online", "bank"] as const;
  const scoreboard = mainCodes
    .map((code) => accounts.find((a) => a.code === code))
    .filter(Boolean)
    .map((a) => {
      const acc = a!;
      const totals = byAccount.get(acc.id) || { income: 0, expense: 0 };
      return { code: acc.code, name: acc.name, balanceKopeks: totals.income - totals.expense };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Касса</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/finance/reconciliations" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Сверки
          </Link>
          <Link href="/admin/finance/reports" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Отчёты
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scoreboard.map((s) => (
          <div key={s.code} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-sm text-gray-400">{s.name}</div>
            <div className="text-2xl font-bold text-white mt-2">{formatRub(s.balanceKopeks)}</div>
          </div>
        ))}
      </div>
      <FinanceClient
        accounts={accounts.map((a) => ({ code: a.code, name: a.name })) as any}
        entries={entries.map((e) => ({
          id: e.id,
          createdAt: e.createdAt.toISOString(),
          accountCode: e.account.code,
          direction: e.direction,
          entryType: e.entryType,
          amountKopeks: e.amountKopeks,
          description: e.description,
        }))}
      />
    </div>
  );
}
