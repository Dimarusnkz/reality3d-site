import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import ShopProductsTable from "./products-table";

export default async function AdminShopProductsPage() {
  const prisma = getPrisma();
  const products = await prisma.shopProduct.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Карточки товаров</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/warehouse/catalog"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Каталог (склад)
          </Link>
          <Link
            href="/admin/warehouse/categories"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Категории
          </Link>
        </div>
      </div>

      <ShopProductsTable initialProducts={products as any[]} />
    </div>
  );
}
