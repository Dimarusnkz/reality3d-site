import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import ShopProductsTable from "./products-table";
import { LinkButton } from "@/components/ui/button";

export default async function AdminShopProductsPage() {
  const prisma = getPrisma();
  const products = await prisma.shopProduct.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Карточки товаров</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">E-commerce Showcase Management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton
            href="/admin/warehouse/catalog"
            variant="secondary"
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px]"
          >
            Каталог (склад)
          </LinkButton>
          <LinkButton
            href="/admin/warehouse/categories"
            variant="secondary"
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px]"
          >
            Категории
          </LinkButton>
          <LinkButton
            href="/admin/shop/products/new"
            variant="primary"
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px]"
          >
            Добавить товар
          </LinkButton>
        </div>
      </div>

      <ShopProductsTable initialProducts={products as any[]} />
    </div>
  );
}
