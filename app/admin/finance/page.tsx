import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { FinanceClient } from "./finance-client";
import { formatRub } from "@/lib/shop/money";
import { LinkButton } from "@/components/ui/button";
import { Wallet, History, FileBarChart } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Финансы и касса</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Cash Flow & Revenue Control</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/admin/finance/reconciliations" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <History className="mr-2 h-3.5 w-3.5" />
            Сверки
          </LinkButton>
          <LinkButton href="/admin/finance/reports" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <FileBarChart className="mr-2 h-3.5 w-3.5" />
            Отчёты
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scoreboard.map((s) => (
          <div key={s.code} className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-black text-white mb-1 tracking-tighter">{formatRub(s.balanceKopeks)}</div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.name}</p>
            </div>
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
