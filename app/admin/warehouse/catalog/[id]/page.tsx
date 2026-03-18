import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { ProductForm } from "@/app/admin/shop/products/product-form";

export default async function AdminWarehouseEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const canEditPurchasePrice = await hasPermission(userId, session.role, "products.purchase_price.edit");

  const prisma = getPrisma();
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  const [product, categories] = await Promise.all([
    prisma.shopProduct.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        itemType: true,
        shortDescription: true,
        description: true,
        priceKopeks: true,
        purchasePriceKopeks: true,
        compareAtKopeks: true,
        stock: true,
        allowPreorder: true,
        isActive: true,
        categoryId: true,
      },
    }),
    prisma.shopCategory.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Редактировать товар</h1>
          <div className="text-sm text-gray-400 mt-1">/{product.slug}</div>
        </div>
        <Link
          href="/admin/warehouse/catalog"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Назад
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <ProductForm categories={categories} product={product as any} canEditPurchasePrice={canEditPurchasePrice} />
      </div>
    </div>
  );
}
