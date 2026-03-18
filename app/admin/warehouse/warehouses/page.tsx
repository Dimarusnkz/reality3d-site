import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { WarehousesClient } from "./warehouses-client";

export default async function AdminWarehousesPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.locations.manage");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const warehouses = await prisma.warehouse.findMany({ select: { id: true, code: true, name: true, isActive: true }, orderBy: { id: "asc" }, take: 200 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Склады</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
        </div>
      </div>

      <WarehousesClient initial={warehouses as any} />
    </div>
  );
}

