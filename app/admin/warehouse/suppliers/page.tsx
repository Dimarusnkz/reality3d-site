import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { SuppliersClient } from "./suppliers-client";
import { LinkButton } from "@/components/ui/button";
import { Receipt, Boxes } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Поставщики</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Vendor & Supply Management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/admin/warehouse/receipts" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <Receipt className="mr-2 h-3.5 w-3.5" />
            Приходы
          </LinkButton>
          <LinkButton href="/admin/warehouse/catalog" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <Boxes className="mr-2 h-3.5 w-3.5" />
            Каталог
          </LinkButton>
        </div>
      </div>

      <SuppliersClient initial={suppliers as any} />
    </div>
  );
}

