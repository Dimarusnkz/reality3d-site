import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import CatalogProductsTable from "./products-table";

export default async function AdminWarehouseCatalogPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const products = await prisma.shopProduct.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 }, inventoryItem: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Каталог</h1>
          <div className="text-sm text-gray-400 mt-1">Цены, категории, остатки, публикация</div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/warehouse/catalog/new"
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
          >
            Добавить товар
          </Link>
          <Link
            href="/admin/warehouse/categories"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Категории
          </Link>
          <Link
            href="/admin/warehouse/receipts"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Приходы
          </Link>
          <Link
            href="/admin/warehouse/low-stock"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Низкий остаток
          </Link>
        </div>
      </div>

      <CatalogProductsTable initialProducts={products as any[]} />
    </div>
  );
}
