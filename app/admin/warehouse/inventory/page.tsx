import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { InventoryClient } from "./inventory-client";

type SearchParams = { w?: string };

export default async function AdminWarehouseInventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.inventory");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const inventories = await prisma.warehouseInventoryCount.findMany({
    where: { warehouseId: w },
    select: { id: true, startedAt: true, status: true, _count: { select: { items: true } } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Инвентаризация</h1>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href="/admin/logs" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Логи
          </Link>
        </div>
      </div>

      <InventoryClient
        warehouseId={w}
        rows={inventories.map((i) => ({ id: i.id, startedAt: i.startedAt.toISOString(), status: i.status, itemsCount: i._count.items }))}
      />
    </div>
  );
}
