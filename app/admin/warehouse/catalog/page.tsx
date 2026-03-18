import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import CatalogProductsTable from "./products-table";

type SearchParams = { w?: string };

export default async function AdminWarehouseCatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const products = await prisma.shopProduct.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 }, inventoryItems: { where: { warehouseId: w }, take: 1 } },
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
            href={`/admin/warehouse/catalog/new?w=${w}`}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
          >
            Добавить товар
          </Link>
          <Link
            href={`/admin/warehouse/categories?w=${w}`}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Категории
          </Link>
          <Link
            href={`/admin/warehouse/receipts?w=${w}`}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Приходы
          </Link>
          <Link
            href={`/admin/warehouse/low-stock?w=${w}`}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Низкий остаток
          </Link>
        </div>
      </div>

      <CatalogProductsTable initialProducts={products as any[]} warehouseId={w} />
    </div>
  );
}
