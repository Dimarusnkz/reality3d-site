import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { formatRub } from "@/lib/shop/money";

type SearchParams = { w?: string; from?: string; to?: string };

function parseDate(input: string | undefined, fallback: Date) {
  if (!input) return fallback;
  const d = new Date(input);
  return Number.isFinite(d.getTime()) ? d : fallback;
}

export default async function AdminWarehouseReportCogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const wRaw = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(wRaw) ? wRaw : 1;

  const now = new Date();
  const from = parseDate(sp.from, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
  const to = parseDate(sp.to, now);

  const prisma = getPrisma();
  const logs = await prisma.shopWarehouseLog.findMany({
    where: {
      warehouseId: w,
      actionType: "writeoff",
      reason: "sale",
      createdAt: { gte: from, lte: to },
    },
    select: { createdAt: true, totalCostKopeks: true, quantityDelta: true, unit: true },
    orderBy: { createdAt: "desc" },
    take: 20000,
  });

  const byDay = new Map<string, { day: string; cost: number; qty: number }>();
  for (const l of logs) {
    const day = l.createdAt.toISOString().slice(0, 10);
    const cost = l.totalCostKopeks || 0;
    const qty = Math.abs(Number(l.quantityDelta));
    const prev = byDay.get(day);
    if (!prev) byDay.set(day, { day, cost, qty });
    else {
      prev.cost += cost;
      prev.qty += qty;
    }
  }
  const rows = Array.from(byDay.values()).sort((a, b) => (a.day < b.day ? 1 : -1));
  const total = rows.reduce((s, r) => s + r.cost, 0);

  const qs = new URLSearchParams({ w: String(w), from: from.toISOString(), to: to.toISOString(), report: "cogs" });
  const exportUrl = `/api/admin/warehouse/reports/export?${qs.toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Отчёт: себестоимость продаж (COGS)</h1>
          <div className="text-sm text-gray-400 mt-1">
            {from.toLocaleDateString("ru-RU")} — {to.toLocaleDateString("ru-RU")} · Итого <span className="text-white font-semibold">{formatRub(total)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse/reports?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Назад
          </Link>
          <Link href={exportUrl} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors">
            Экспорт CSV
          </Link>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">По дням</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Дата</th>
              <th className="p-4 text-right font-medium">Кол-во (шт/ед.)</th>
              <th className="p-4 text-right font-medium">COGS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.day} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300">{new Date(r.day).toLocaleDateString("ru-RU")}</td>
                <td className="p-4 text-right text-gray-200">{r.qty.toFixed(3)}</td>
                <td className="p-4 text-right text-white font-semibold">{formatRub(r.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет данных</div> : null}
      </div>
    </div>
  );
}

