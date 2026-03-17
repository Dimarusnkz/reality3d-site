import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { AddToCartButton } from "../add-to-cart-button";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const prisma = getPrisma();
  const { slug } = await params;

  const product = await prisma.shopProduct.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
  });

  if (!product || !product.isActive) notFound();

  const image = product.images[0]?.url || "/grid.svg";

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <div className="text-sm text-gray-500">
        <Link href="/shop" className="hover:text-primary transition-colors">
          Магазин
        </Link>
        {product.category ? (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-primary transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="aspect-[4/3]">
              <img src={image} alt={product.images[0]?.alt || product.name} className="w-full h-full object-cover" />
            </div>
          </div>
          {product.images.length > 1 ? (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.slice(0, 8).map((img) => (
                <div key={img.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <img src={img.url} alt={img.alt || product.name} className="w-full h-20 object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{product.name}</h1>
            {product.sku ? <div className="text-xs text-gray-500 font-mono">Артикул: {product.sku}</div> : null}
          </div>

          <div className="flex items-end gap-4">
            <div className="text-2xl font-bold text-white">{formatRub(product.priceKopeks)}</div>
            {product.compareAtKopeks ? (
              <div className="text-sm text-gray-500 line-through">{formatRub(product.compareAtKopeks)}</div>
            ) : null}
          </div>

          <div className="text-sm">
            {product.stock > 0 ? (
              <span className="text-green-500">В наличии: {product.stock}</span>
            ) : (
              <span className="text-yellow-500">Под заказ</span>
            )}
          </div>

          <AddToCartButton productId={product.id} />

          {product.shortDescription ? <p className="text-gray-300">{product.shortDescription}</p> : null}

          {product.description ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 text-gray-300 whitespace-pre-wrap">
              {product.description}
            </div>
          ) : null}

          <div className="text-xs text-gray-500">
            Самовывоз: Санкт-Петербург, пр. Современников, д. 1, к. 3. Доставка по СПб и РФ — на этапе оформления.
          </div>
        </div>
      </div>
    </div>
  );
}

