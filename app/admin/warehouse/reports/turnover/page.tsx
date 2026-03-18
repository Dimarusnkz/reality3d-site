import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";

type SearchParams = { w?: string; from?: string; to?: string };

function parseDate(input: string | undefined, fallback: Date) {
  if (!input) return fallback;
  const d = new Date(input);
  return Number.isFinite(d.getTime()) ? d : fallback;
}

export default async function AdminWarehouseReportTurnoverPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));

  const prisma = getPrisma();

  const [salesLogs, inventory] = await Promise.all([
    prisma.shopWarehouseLog.findMany({
      where: { warehouseId: w, actionType: "writeoff", reason: "sale", createdAt: { gte: from, lte: to }, unit: "pcs" },
      select: { productId: true, sku: true, productName: true, quantityDelta: true },
      take: 50000,
    }),
    prisma.shopInventoryItem.findMany({
      where: { warehouseId: w, unit: "pcs" },
      select: { productId: true, quantity: true, reserved: true },
      take: 10000,
    }),
  ]);

  const sold = new Map<number, { productId: number; sku: string | null; name: string | null; soldQty: number }>();
  for (const l of salesLogs) {
    if (!l.productId) continue;
    const qty = Math.abs(Number(l.quantityDelta));
    const prev = sold.get(l.productId);
    if (!prev) sold.set(l.productId, { productId: l.productId, sku: l.sku || null, name: l.productName || null, soldQty: qty });
    else prev.soldQty += qty;
  }

  const invMap = new Map<number, { qty: number; reserved: number; free: number }>();
  for (const i of inventory) {
    const qty = Number(i.quantity);
    const reserved = Number(i.reserved);
    invMap.set(i.productId, { qty, reserved, free: Math.max(0, qty - reserved) });
  }

  const rows = Array.from(sold.values())
    .map((s) => {
      const inv = invMap.get(s.productId) || { qty: 0, reserved: 0, free: 0 };
      const daily = s.soldQty / days;
      const turnoverDays = daily > 0 ? inv.qty / daily : null;
      return { ...s, currentQty: inv.qty, currentFree: inv.free, turnoverDays };
    })
    .sort((a, b) => {
      const ta = a.turnoverDays == null ? Number.POSITIVE_INFINITY : a.turnoverDays;
      const tb = b.turnoverDays == null ? Number.POSITIVE_INFINITY : b.turnoverDays;
      return ta - tb;
    });

  const qs = new URLSearchParams({ w: String(w), from: from.toISOString(), to: to.toISOString(), report: "turnover" });
  const exportUrl = `/api/admin/warehouse/reports/export?${qs.toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Отчёт: оборачиваемость</h1>
          <div className="text-sm text-gray-400 mt-1">
            {from.toLocaleDateString("ru-RU")} — {to.toLocaleDateString("ru-RU")} · период {days} дн.
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
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">По продажам (шт)</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Товар</th>
              <th className="p-4 text-right font-medium">Продано</th>
              <th className="p-4 text-right font-medium">Остаток</th>
              <th className="p-4 text-right font-medium">Свободно</th>
              <th className="p-4 text-right font-medium">Дни оборота</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.productId} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="text-white font-medium">{r.name || "—"}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{r.sku || "—"}</div>
                </td>
                <td className="p-4 text-right text-white font-semibold">{r.soldQty.toFixed(0)}</td>
                <td className="p-4 text-right text-gray-200">{r.currentQty.toFixed(0)}</td>
                <td className="p-4 text-right text-gray-200">{r.currentFree.toFixed(0)}</td>
                <td className="p-4 text-right text-gray-200">{r.turnoverDays == null ? "—" : r.turnoverDays.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет данных</div> : null}
      </div>
    </div>
  );
}

