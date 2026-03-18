import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { WarehouseClient } from "../warehouse-client";
import { WarehouseSwitcher } from "../warehouse-switcher";

type SearchParams = { w?: string };

export default async function AdminWarehouseOperationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;

  const prisma = getPrisma();

  const [warehouses, products, inventory] = await Promise.all([
    prisma.warehouse.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { id: "asc" } }),
    prisma.shopProduct.findMany({
      select: { id: true, name: true, sku: true, stock: true },
      orderBy: { name: "asc" },
      take: 1000,
    }),
    prisma.shopInventoryItem.findMany({
      where: { warehouseId: Number.isFinite(warehouseId) ? warehouseId : 1 },
      select: { productId: true, unit: true, quantity: true, reserved: true, minThreshold: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    }),
  ]);

  const inv = inventory.map((i) => ({
    productId: i.productId,
    unit: i.unit,
    quantity: i.quantity.toString(),
    reserved: i.reserved.toString(),
    minThreshold: i.minThreshold.toString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Операции склада</h1>
          <div className="text-sm text-gray-400 mt-1">Приход / списание / пороги</div>
        </div>
        <div className="flex items-center gap-3">
          <WarehouseSwitcher warehouses={warehouses} currentId={Number.isFinite(warehouseId) ? warehouseId : 1} />
          <Link href={`/admin/warehouse?w=${Number.isFinite(warehouseId) ? warehouseId : 1}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Назад
          </Link>
        </div>
      </div>

      <WarehouseClient products={products} inventory={inv} warehouseId={Number.isFinite(warehouseId) ? warehouseId : 1} />
    </div>
  );
}
