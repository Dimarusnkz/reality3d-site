import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { LocationsClient } from "./locations-client";

type SearchParams = { w?: string };

export default async function AdminWarehouseLocationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.locations.manage");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const locations = await prisma.warehouseLocation.findMany({
    where: { warehouseId: w },
    select: { id: true, code: true, name: true, isActive: true },
    orderBy: { code: "asc" },
    take: 2000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Локации склада</h1>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href={`/admin/warehouse/receipts?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Приходы
          </Link>
        </div>
      </div>

      <LocationsClient initial={locations} warehouseId={w} />
    </div>
  );
}
