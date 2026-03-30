import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { cn } from "@/lib/utils";
import Link from "next/link";

export async function RecentFinance() {
  const prisma = getPrisma();
  const recentCashEntries = await prisma.cashEntry.findMany({
    select: { id: true, createdAt: true, direction: true, entryType: true, amountKopeks: true, description: true, account: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="neon-card rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Движение средств</h2>
        <Link href="/admin/finance" className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors">
          Вся касса
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/50 text-gray-500 border-b border-slate-800/50">
            <tr>
              <th className="px-6 py-3 font-bold uppercase tracking-tighter">Дата</th>
              <th className="px-6 py-3 font-bold uppercase tracking-tighter">Тип</th>
              <th className="px-6 py-3 font-bold uppercase tracking-tighter text-right">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {recentCashEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-primary/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="text-white font-medium">{new Date(entry.createdAt).toLocaleDateString('ru-RU')}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{entry.account?.name || "Основной счет"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-400 max-w-[150px] truncate" title={entry.description || ""}>
                    {entry.description || entry.entryType}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={cn(
                    "font-bold",
                    entry.direction === "income" ? "text-green-500" : "text-red-500"
                  )}>
                    {entry.direction === "income" ? "+" : "-"}{formatRub(entry.amountKopeks)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RecentFinanceSkeleton() {
  return (
    <div className="neon-card rounded-2xl border border-slate-800 bg-slate-900/20 h-[400px] animate-pulse">
      <div className="p-6 border-b border-slate-800 h-14"></div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-slate-800/50 rounded"></div>
        ))}
      </div>
    </div>
  );
}
