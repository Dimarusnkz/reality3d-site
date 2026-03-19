import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { AddToCartButton } from "../add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Truck, ShieldCheck, Info } from "lucide-react";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const prisma = getPrisma();
  const { slug } = await params;

  const product = await prisma.shopProduct.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
  });

  if (!product || !product.isActive || product.itemType !== "product") notFound();

  const image = product.images[0]?.url || "/grid.svg";
  const isOutOfStock = product.stock <= 0 && !product.allowPreorder;

  return (
    <div className="container mx-auto px-4 py-12 space-y-10 max-w-7xl">
      <div className="flex items-center gap-4">
        <Link href="/shop" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-primary transition-all">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-sm text-gray-500">
          <Link href="/shop" className="hover:text-primary transition-colors">Магазин</Link>
          {product.category ? (
            <>
              <span className="mx-2 text-slate-800">/</span>
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary transition-colors">
                {product.category.name}
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Галерея */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative group">
            <div className="aspect-[4/3] relative">
              <img 
                src={image} 
                alt={product.images[0]?.alt || product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
            </div>
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              {product.stock > 0 ? (
                <Badge variant="success" className="shadow-2xl backdrop-blur-md bg-green-500/20 border-green-500/30 px-4 py-1.5 text-xs font-bold uppercase">В наличии</Badge>
              ) : product.allowPreorder ? (
                <Badge variant="warning" className="shadow-2xl backdrop-blur-md bg-yellow-500/20 border-yellow-500/30 px-4 py-1.5 text-xs font-bold uppercase">Под заказ</Badge>
              ) : (
                <Badge variant="error" className="shadow-2xl backdrop-blur-md bg-red-500/20 border-red-500/30 px-4 py-1.5 text-xs font-bold uppercase">Нет в наличии</Badge>
              )}
            </div>
          </div>
          
          {product.images.length > 1 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {product.images.slice(0, 12).map((img) => (
                <div key={img.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-square cursor-pointer hover:border-primary transition-colors">
                  <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          {/* Описание (технические блоки свернуты в плане, но тут вынесем ниже) */}
          <div className="pt-10 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                Описание товара
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-400 leading-relaxed text-lg">
                  {product.description || product.shortDescription || "Описание в процессе подготовки..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Инфо и Покупка */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-8">
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                {product.category?.name || "Reality3D Store"}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {product.name}
              </h1>
              {product.sku && (
                <div className="inline-block px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-gray-500">
                  SKU: {product.sku}
                </div>
              )}
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-8">
              <div className="flex items-end gap-4">
                <div className="text-5xl font-black text-white tracking-tighter">
                  {formatRub(product.priceKopeks)}
                </div>
                {product.compareAtKopeks ? (
                  <div className="text-xl text-gray-600 line-through mb-1.5 font-bold">
                    {formatRub(product.compareAtKopeks)}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <AddToCartButton 
                  productId={product.id} 
                  disabled={isOutOfStock}
                  className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl shadow-primary/20"
                />
                <p className="text-center text-[10px] text-gray-500">
                  Доступна оплата картой, QR-кодом или переводом через Т-Банк
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-800">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Быстрая доставка</div>
                    <div className="text-xs text-gray-500 mt-0.5">СДЭК, Яндекс или самовывоз в СПб</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-blue-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Гарантия качества</div>
                    <div className="text-xs text-gray-500 mt-0.5">Проверка каждого товара перед отправкой</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Технические характеристики (свернуты по умолчанию в UI, тут просто выведем компактно) */}
            {(product.weightGrams || product.lengthMm) && (
              <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/20">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Характеристики</h3>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  {product.weightGrams ? (
                    <>
                      <div className="text-gray-500">Вес</div>
                      <div className="text-white font-medium text-right">{(product.weightGrams / 1000).toFixed(2)} кг</div>
                    </>
                  ) : null}
                  {product.lengthMm && product.widthMm && product.heightMm ? (
                    <>
                      <div className="text-gray-500">Габариты</div>
                      <div className="text-white font-medium text-right">
                        {Math.round(product.lengthMm / 10) / 10}×{Math.round(product.widthMm / 10) / 10}×{Math.round(product.heightMm / 10) / 10} см
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
