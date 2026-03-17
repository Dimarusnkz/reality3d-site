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
        <h1 className="text-2xl font-bold text-white">Товары</h1>
        <Link
          href="/admin/shop/products/new"
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
        >
          Добавить товар
        </Link>
      </div>

      <ShopProductsTable initialProducts={products as any[]} />
    </div>
  );
}

