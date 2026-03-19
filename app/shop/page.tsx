import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { AddToCartButton } from "./add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Package, Check } from "lucide-react";

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
    <div className="container mx-auto px-4 py-12 space-y-10 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="secondary" className="mb-2">Материалы и товары</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Магазин Reality3D</h1>
          <p className="text-gray-400 mt-2 text-lg">Все необходимое для 3D‑печати в одном месте</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            <div className="neon-card p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Фильтры
              </h3>
              
              <form className="space-y-6" action="/shop">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Поиск</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      name="q"
                      defaultValue={q}
                      placeholder="Название или артикул"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-primary outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Категория</label>
                  <select
                    name="category"
                    defaultValue={categorySlug}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Все категории</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Цена (₽)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      name="min"
                      defaultValue={sp.min || ""}
                      inputMode="numeric"
                      placeholder="От"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none transition-all text-sm text-center"
                    />
                    <input
                      name="max"
                      defaultValue={sp.max || ""}
                      inputMode="numeric"
                      placeholder="До"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none transition-all text-sm text-center"
                    />
                  </div>
                </div>

                <button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20">
                  Применить
                </button>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-800/50">
              <p className="text-xs text-gray-500 leading-relaxed text-center">
                Нужна помощь в выборе материалов? <br/>
                <Link href="/contacts" className="text-primary hover:underline font-medium">Спросите эксперта</Link>
              </p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          {products.length === 0 ? (
            <div className="neon-card p-20 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 text-center">
              <Package className="h-16 w-16 text-slate-800 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Товары не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить параметры фильтрации или поиска</p>
              <Link href="/shop" className="mt-6 inline-block text-primary font-bold uppercase tracking-wider text-xs">Сбросить все</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {products.map((p) => {
                const image = p.images[0]?.url || "/grid.svg";
                const isOutOfStock = p.stock <= 0 && !p.allowPreorder;
                
                return (
                  <div key={p.id} className="group relative flex flex-col bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-500 h-full hover:-translate-y-1">
                    <Link href={`/shop/${p.slug}`} className="block flex-shrink-0 relative overflow-hidden aspect-square bg-slate-950">
                      <img 
                        src={image} 
                        alt={p.images[0]?.alt || p.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {p.stock > 0 ? (
                          <Badge variant="success" className="shadow-lg backdrop-blur-md bg-green-500/20 border-green-500/30">В наличии</Badge>
                        ) : p.allowPreorder ? (
                          <Badge variant="warning" className="shadow-lg backdrop-blur-md bg-yellow-500/20 border-yellow-500/30">Под заказ</Badge>
                        ) : null}
                      </div>
                    </Link>
                    
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                          {p.category?.name || "Товар"}
                        </div>
                        <Link href={`/shop/${p.slug}`} className="block group/title">
                          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover/title:text-primary transition-colors">
                            {p.name}
                          </h3>
                        </Link>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                        <div className="text-2xl font-black text-white tracking-tighter">
                          {formatRub(p.priceKopeks)}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-primary transition-colors">
                          <Check className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <AddToCartButton productId={p.id} disabled={isOutOfStock} />
                      </div>
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
