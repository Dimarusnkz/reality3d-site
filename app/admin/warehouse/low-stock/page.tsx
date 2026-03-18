import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";

type SearchParams = { w?: string };

export default async function AdminWarehouseLowStockPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const items = await prisma.shopInventoryItem.findMany({
    where: { warehouseId: w, minThreshold: { gt: 0 } },
    select: {
      productId: true,
      unit: true,
      quantity: true,
      reserved: true,
      minThreshold: true,
      product: { select: { id: true, name: true, slug: true, sku: true, stock: true, isActive: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const rows = items
    .map((i) => {
      const qty = Number(i.quantity);
      const reserved = Number(i.reserved);
      const free = qty - reserved;
      return { ...i, qty, reserved, free };
    })
    .filter((i) => i.free <= Number(i.minThreshold))
    .sort((a, b) => a.free - b.free);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Низкий остаток</h1>
          <div className="text-sm text-gray-400 mt-1">Свободно ≤ порога</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href={`/admin/warehouse/catalog?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Каталог
          </Link>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">
          Позиций: <span className="text-white font-semibold">{rows.length}</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Товар</th>
              <th className="p-4 text-right font-medium">Свободно</th>
              <th className="p-4 text-right font-medium">Резерв</th>
              <th className="p-4 text-right font-medium">Всего</th>
              <th className="p-4 text-right font-medium">Порог</th>
              <th className="p-4 text-right font-medium">Открыть</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.productId} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="text-white font-medium">{r.product?.name || "—"}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {r.product?.sku || "—"} / {r.unit}
                  </div>
                </td>
                <td className="p-4 text-right text-white font-semibold">{Math.max(0, r.free)}</td>
                <td className="p-4 text-right text-gray-200">{r.reserved}</td>
                <td className="p-4 text-right text-gray-200">{r.qty}</td>
                <td className="p-4 text-right text-gray-300">{Number(r.minThreshold)}</td>
                <td className="p-4 text-right">
                  <Link
                    href={`/admin/warehouse/catalog/${r.productId}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors"
                  >
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Низких остатков нет</div> : null}
      </div>
    </div>
  );
}
