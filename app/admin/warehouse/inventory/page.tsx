import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { InventoryClient } from "./inventory-client";

export default async function AdminWarehouseInventoryPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.inventory");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const inventories = await prisma.warehouseInventoryCount.findMany({
    select: { id: true, startedAt: true, status: true, _count: { select: { items: true } } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Инвентаризация</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href="/admin/logs" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Логи
          </Link>
        </div>
      </div>

      <InventoryClient rows={inventories.map((i) => ({ id: i.id, startedAt: i.startedAt.toISOString(), status: i.status, itemsCount: i._count.items }))} />
    </div>
  );
}

