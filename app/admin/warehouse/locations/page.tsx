import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { LocationsClient } from "./locations-client";

export default async function AdminWarehouseLocationsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.locations.manage");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const locations = await prisma.warehouseLocation.findMany({
    where: { warehouseId: 1 },
    select: { id: true, code: true, name: true, isActive: true },
    orderBy: { code: "asc" },
    take: 2000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Локации склада</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href="/admin/warehouse/receipts" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Приходы
          </Link>
        </div>
      </div>

      <LocationsClient initial={locations} />
    </div>
  );
}

