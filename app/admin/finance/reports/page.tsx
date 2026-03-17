import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { getMskDayKeyFromDate, getMskDayRangeUtc } from "@/lib/time-msk";

type SearchParams = {
  from?: string;
  to?: string;
};

function formatRub(kopeks: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(kopeks / 100);
}

export default async function AdminFinanceReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "finance.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const today = getMskDayKeyFromDate(new Date());
  const fromKey = sp.from || today;
  const toKey = sp.to || today;
  const fromRange = getMskDayRangeUtc(fromKey);
  const toRange = getMskDayRangeUtc(toKey);
  if (!fromRange || !toRange) redirect(`/admin/finance/reports?from=${today}&to=${today}`);

  const range = { start: fromRange.start, end: toRange.end };
  const prisma = getPrisma();

  const [revenueAgg, cogsAgg, cogsMissing, revenueByOrder, cogsByOrder] = await Promise.all([
    prisma.cashEntry.aggregate({
      where: { direction: "income", entryType: "order_payment", createdAt: { gte: range.start, lt: range.end } },
      _sum: { amountKopeks: true },
    }),
    prisma.shopWarehouseLog.aggregate({
      where: { actionType: "writeoff", reason: "sale", totalCostKopeks: { not: null }, createdAt: { gte: range.start, lt: range.end } },
      _sum: { totalCostKopeks: true },
    }),
    prisma.shopWarehouseLog.count({
      where: { actionType: "writeoff", reason: "sale", totalCostKopeks: null, createdAt: { gte: range.start, lt: range.end } },
    }),
    prisma.cashEntry.groupBy({
      by: ["shopOrderId"],
      where: { direction: "income", entryType: "order_payment", shopOrderId: { not: null }, createdAt: { gte: range.start, lt: range.end } },
      _sum: { amountKopeks: true },
      orderBy: { _sum: { amountKopeks: "desc" } },
      take: 200,
    }),
    prisma.shopWarehouseLog.groupBy({
      by: ["shopOrderId"],
      where: { actionType: "writeoff", reason: "sale", shopOrderId: { not: null }, createdAt: { gte: range.start, lt: range.end } },
      _sum: { totalCostKopeks: true },
      take: 2000,
    }),
  ]);

  const revenue = revenueAgg._sum.amountKopeks ?? 0;
  const cogs = cogsAgg._sum.totalCostKopeks ?? 0;
  const margin = revenue - cogs;

  const costMap = new Map<string, number>();
  for (const row of cogsByOrder) {
    if (!row.shopOrderId) continue;
    costMap.set(row.shopOrderId, row._sum.totalCostKopeks ?? 0);
  }

  const orders = revenueByOrder
    .filter((r) => r.shopOrderId)
    .map((r) => {
      const id = r.shopOrderId as string;
      const rev = r._sum.amountKopeks ?? 0;
      const cost = costMap.get(id) ?? 0;
      return { id, revenue: rev, cogs: cost, margin: rev - cost };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Финансовые отчёты</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/finance" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Касса
          </Link>
          <Link
            href="/admin/finance/reconciliations"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Сверки
          </Link>
        </div>
      </div>

      <form className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end" action="/admin/finance/reports">
        <div className="space-y-2">
          <label className="block text-xs text-gray-400">С (МСК)</label>
          <input name="from" defaultValue={fromKey} type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-gray-400">По (МСК)</label>
          <input name="to" defaultValue={toKey} type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <button className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">Показать</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Выручка (оплаты)</div>
          <div className="text-white text-2xl font-bold mt-1">{formatRub(revenue)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Себестоимость (автосписания)</div>
          <div className="text-white text-2xl font-bold mt-1">{formatRub(cogs)}</div>
          <div className="text-xs text-gray-500 mt-2">Без себестоимости: {cogsMissing}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Маржа</div>
          <div className={`text-2xl font-bold mt-1 ${margin < 0 ? "text-red-300" : "text-white"}`}>{formatRub(margin)}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Топ заказов по выручке</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Заказ</th>
              <th className="p-4 text-right font-medium">Выручка</th>
              <th className="p-4 text-right font-medium">Себестоимость</th>
              <th className="p-4 text-right font-medium">Маржа</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300 font-mono text-xs">{o.id}</td>
                <td className="p-4 text-right text-white font-semibold">{formatRub(o.revenue)}</td>
                <td className="p-4 text-right text-gray-200">{formatRub(o.cogs)}</td>
                <td className={`p-4 text-right font-semibold ${o.margin < 0 ? "text-red-300" : "text-gray-200"}`}>{formatRub(o.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <div className="p-8 text-center text-gray-500">Нет данных за период</div> : null}
      </div>
    </div>
  );
}

