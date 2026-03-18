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

export default async function AdminWarehouseReportConsumptionPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
      actionType: "production_consume",
      createdAt: { gte: from, lte: to },
    },
    select: { productId: true, sku: true, productName: true, quantityDelta: true, unit: true, totalCostKopeks: true },
    orderBy: { createdAt: "desc" },
    take: 20000,
  });

  const by = new Map<number, { productId: number; sku: string | null; name: string | null; unit: string; qty: number; cost: number }>();
  for (const l of logs) {
    if (!l.productId) continue;
    const qty = Math.abs(Number(l.quantityDelta));
    const cost = l.totalCostKopeks || 0;
    const prev = by.get(l.productId);
    if (!prev) {
      by.set(l.productId, { productId: l.productId, sku: l.sku || null, name: l.productName || null, unit: l.unit, qty, cost });
    } else {
      prev.qty += qty;
      prev.cost += cost;
    }
  }
  const rows = Array.from(by.values()).sort((a, b) => b.cost - a.cost);

  const qs = new URLSearchParams({ w: String(w), from: from.toISOString(), to: to.toISOString(), report: "consumption" });
  const exportUrl = `/api/admin/warehouse/reports/export?${qs.toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Отчёт: расход сырья</h1>
          <div className="text-sm text-gray-400 mt-1">
            {from.toLocaleDateString("ru-RU")} — {to.toLocaleDateString("ru-RU")}
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
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Материалы</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Материал</th>
              <th className="p-4 text-right font-medium">Кол-во</th>
              <th className="p-4 text-right font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.productId} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="text-white font-medium">{r.name || "—"}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{r.sku || "—"}</div>
                </td>
                <td className="p-4 text-right text-gray-200">
                  {r.qty.toFixed(3)} {r.unit}
                </td>
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

