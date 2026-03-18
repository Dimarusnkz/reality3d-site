import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { ProductionClient } from "./production-client";

export default async function AdminWarehouseProductionPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.production");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const [products, productions] = await Promise.all([
    prisma.shopProduct.findMany({ select: { id: true, name: true, sku: true, itemType: true }, orderBy: { name: "asc" }, take: 2000 }),
    prisma.warehouseProductionOrder.findMany({
      select: { id: true, createdAt: true, status: true, quantity: true, unit: true, product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Производство</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse/recipes" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Рецептуры
          </Link>
          <Link href="/admin/warehouse" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
        </div>
      </div>

      <ProductionClient
        products={products as any}
        rows={productions.map((p) => ({ id: p.id, createdAt: p.createdAt.toISOString(), status: p.status, productName: p.product.name, qty: `${p.quantity.toString()} ${p.unit}` }))}
      />
    </div>
  );
}

