import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProductCardForm } from "../product-card-form";

export default async function EditShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  if (!["admin", "manager"].includes(session.role)) redirect("/admin");

  const prisma = getPrisma();
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (!Number.isFinite(productId)) notFound();

  const product = await prisma.shopProduct.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      description: true,
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Оформление карточки</h1>
          <div className="text-sm text-gray-400 mt-1">/{product.slug}</div>
        </div>
        <Link
          href="/admin/shop/products"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Назад
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <ProductCardForm
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            shortDescription: product.shortDescription,
            description: product.description,
            imageUrls: product.images.map((i) => i.url),
          }}
        />
      </div>
    </div>
  );
}
