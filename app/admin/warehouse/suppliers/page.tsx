import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { SuppliersClient } from "./suppliers-client";

export default async function AdminWarehouseSuppliersPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.receipt");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const suppliers = await prisma.warehouseSupplier.findMany({
    select: { id: true, name: true, contact: true, phone: true, email: true, contractNumber: true, isActive: true },
    orderBy: { name: "asc" },
    take: 1000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Поставщики</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse/receipts" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Приходы
          </Link>
          <Link href="/admin/warehouse/catalog" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Каталог
          </Link>
        </div>
      </div>

      <SuppliersClient initial={suppliers as any} />
    </div>
  );
}

