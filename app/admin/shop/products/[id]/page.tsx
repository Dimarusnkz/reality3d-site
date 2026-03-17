import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { ProductForm } from "../product-form";

export default async function EditShopProductPage({ params }: { params: Promise<{ id: string }> }) {
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
        shortDescription: true,
        description: true,
        priceKopeks: true,
        compareAtKopeks: true,
        stock: true,
        isActive: true,
        categoryId: true,
      },
    }),
    prisma.shopCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Редактирование товара</h1>
        <Link
          href="/admin/shop/products"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Назад
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}

