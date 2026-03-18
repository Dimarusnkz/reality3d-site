import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { AddToCartButton } from "./add-to-cart-button";

type SearchParams = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const prisma = getPrisma();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const categorySlug = (sp.category || "").trim();
  const min = sp.min ? parseInt(sp.min, 10) : null;
  const max = sp.max ? parseInt(sp.max, 10) : null;

  const categories = await prisma.shopCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const products = await prisma.shopProduct.findMany({
    where: {
      isActive: true,
      itemType: "product",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(min != null || max != null
        ? {
            priceKopeks: {
              ...(min != null ? { gte: min * 100 } : {}),
              ...(max != null ? { lte: max * 100 } : {}),
            },
          }
        : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Магазин</h1>
        <p className="text-gray-400">
          Расходные материалы и готовые изделия. Санкт-Петербург: самовывоз и доставка.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-5">
            <form className="space-y-3" action="/shop">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Поиск</label>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="PLA, сопло, клей..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Категория</label>
                <select
                  name="category"
                  defaultValue={categorySlug}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Все</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Цена от</label>
                  <input
                    name="min"
                    defaultValue={sp.min || ""}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Цена до</label>
                  <input
                    name="max"
                    defaultValue={sp.max || ""}
                    inputMode="numeric"
                    placeholder="99999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <button className="w-full h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors">
                Применить
              </button>
            </form>

            <div className="text-xs text-gray-500">
              Для покупки потребуется авторизация. Оплата: ТБанк и другие способы — на этапе оформления.
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          {products.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 text-center text-gray-400">
              Ничего не найдено
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((p) => {
                const image = p.images[0]?.url || "/grid.svg";
                const dims =
                  p.lengthMm != null && p.widthMm != null && p.heightMm != null
                    ? `${Math.round(p.lengthMm / 10) / 10}×${Math.round(p.widthMm / 10) / 10}×${Math.round(p.heightMm / 10) / 10} см`
                    : null;
                return (
                  <div key={p.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <Link href={`/shop/${p.slug}`} className="block">
                      <div className="aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img src={image} alt={p.images[0]?.alt || p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="text-white font-semibold line-clamp-2">{p.name}</div>
                        <div className="text-sm text-gray-400">{formatRub(p.priceKopeks)}</div>
                        {p.weightGrams != null || dims ? (
                          <div className="text-xs text-gray-500">
                            {p.weightGrams != null ? <span>Вес: {(p.weightGrams / 1000).toFixed(2)} кг</span> : null}
                            {p.weightGrams != null && dims ? <span className="mx-2">•</span> : null}
                            {dims ? <span>Габариты: {dims}</span> : null}
                          </div>
                        ) : null}
                        {p.stock <= 0 ? (
                          p.allowPreorder ? (
                            <div className="text-xs text-yellow-500">Под заказ</div>
                          ) : (
                            <div className="text-xs text-red-400">Нет в наличии</div>
                          )
                        ) : (
                          <div className="text-xs text-green-500">В наличии: {p.stock}</div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4 pt-0">
                      <AddToCartButton productId={p.id} disabled={!p.allowPreorder && p.stock <= 0} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
