import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { WarehouseClient } from "./warehouse-client";

export default async function AdminWarehousePage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  if (!["admin", "manager", "warehouse", "engineer"].includes(session.role)) redirect("/admin");

  const prisma = getPrisma();

  const [products, inventory] = await Promise.all([
    prisma.shopProduct.findMany({
      select: { id: true, name: true, sku: true, stock: true },
      orderBy: { name: "asc" },
      take: 1000,
    }),
    prisma.shopInventoryItem.findMany({
      select: { productId: true, unit: true, quantity: true, minThreshold: true },
      orderBy: { updatedAt: "desc" },
      take: 2000,
    }),
  ]);

  const inv = inventory.map((i) => ({
    productId: i.productId,
    unit: i.unit,
    quantity: i.quantity.toString(),
    minThreshold: i.minThreshold.toString(),
  }));

  const low = inv.filter((i) => Number(i.minThreshold) > 0 && Number(i.quantity) <= Number(i.minThreshold)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Склад</h1>
        <div className="text-sm text-gray-400">
          Низкий остаток: <span className="text-white font-semibold">{low}</span>
        </div>
      </div>
      <WarehouseClient products={products} inventory={inv} />
    </div>
  );
}

