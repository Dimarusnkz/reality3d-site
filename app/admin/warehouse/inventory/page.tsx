import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { InventoryClient } from "./inventory-client";
import { LinkButton } from "@/components/ui/button";
import { Boxes, History } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Инвентаризация</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Stock Verification & Auditing</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href={`/admin/warehouse?w=${w}`} variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <Boxes className="mr-2 h-3.5 w-3.5" />
            Склад
          </LinkButton>
          <LinkButton href="/admin/logs" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <History className="mr-2 h-3.5 w-3.5" />
            Логи
          </LinkButton>
        </div>
      </div>

      <InventoryClient
        warehouseId={w}
        rows={inventories.map((i) => ({ id: i.id, startedAt: i.startedAt.toISOString(), status: i.status, itemsCount: i._count.items }))}
      />
    </div>
  );
}
