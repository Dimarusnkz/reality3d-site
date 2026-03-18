import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { TransfersClient } from "./transfers-client";

type SearchParams = { w?: string };

export default async function AdminWarehouseTransfersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.transfer");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const [warehouses, locations, transfers] = await Promise.all([
    prisma.warehouse.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true }, orderBy: { id: "asc" }, take: 100 }),
    prisma.warehouseLocation.findMany({ where: { isActive: true }, select: { id: true, warehouseId: true, code: true, name: true }, orderBy: { code: "asc" }, take: 5000 }),
    prisma.warehouseTransfer.findMany({
      where: { OR: [{ fromWarehouseId: w }, { toWarehouseId: w }] },
      select: {
        id: true,
        status: true,
        createdAt: true,
        fromWarehouse: { select: { code: true } },
        toWarehouse: { select: { code: true } },
        fromLocation: { select: { code: true } },
        toLocation: { select: { code: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Перемещения</h1>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href={`/admin/warehouse/locations?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Локации
          </Link>
        </div>
      </div>

      <TransfersClient
        warehouseId={w}
        warehouses={warehouses as any}
        locations={locations as any}
        rows={transfers.map((t) => ({
          id: t.id,
          status: t.status,
          createdAt: t.createdAt.toISOString(),
          from: `${t.fromWarehouse.code}${t.fromLocation?.code ? `/${t.fromLocation.code}` : ""}`,
          to: `${t.toWarehouse.code}${t.toLocation?.code ? `/${t.toLocation.code}` : ""}`,
          itemsCount: t._count.items,
        }))}
      />
    </div>
  );
}

