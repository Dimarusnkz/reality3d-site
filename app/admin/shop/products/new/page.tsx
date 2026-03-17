import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/access";

export default async function NewShopProductPage() {
  const session = await getSession();
  const prisma = getPrisma();
  const categories = await prisma.shopCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  const canEditPurchasePrice = session?.userId
    ? await hasPermission(parseInt(session.userId, 10), session.role, "products.purchase_price.edit")
    : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Новый товар</h1>
        <Link
          href="/admin/shop/products"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Назад
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <ProductForm categories={categories} canEditPurchasePrice={canEditPurchasePrice} />
      </div>
    </div>
  );
}
