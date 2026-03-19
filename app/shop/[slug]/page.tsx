import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { AddToCartButton } from "../add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Truck, ShieldCheck, Info, ShoppingCart } from "lucide-react";
import { ProductDetails } from "@/components/shop/product-details";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const prisma = getPrisma();
  const { slug } = await params;

  const product = await prisma.shopProduct.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
  });

  if (!product || !product.isActive || product.itemType !== "product") notFound();

  const relatedProducts = await prisma.shopProduct.findMany({
    where: { 
      categoryId: product.categoryId, 
      id: { not: product.id },
      isActive: true,
      itemType: "product"
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    take: 4,
  });

  const image = product.images[0]?.url || "/grid.svg";
  const isOutOfStock = product.stock <= 0 && !product.allowPreorder;

  const characteristics = [];
  if (product.weightGrams) characteristics.push({ label: "Вес", value: `${(product.weightGrams / 1000).toFixed(2)} кг` });
  if (product.lengthMm && product.widthMm && product.heightMm) {
    characteristics.push({ 
      label: "Габариты", 
      value: `${Math.round(product.lengthMm / 10) / 10}×${Math.round(product.widthMm / 10) / 10}×${Math.round(product.heightMm / 10) / 10} см` 
    });
  }

  return (
    <div className="container mx-auto px-4 py-16 space-y-24 max-w-7xl">
      <div className="space-y-12">
        <div className="flex items-center gap-4">
          <Link href="/shop" className="w-12 h-12 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/50 transition-all shadow-inner group">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
            <Link href="/shop" className="hover:text-white transition-colors">Магазин</Link>
            {product.category ? (
              <>
                <span className="text-slate-800">/</span>
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary transition-colors">
                  {product.category.name}
                </Link>
              </>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Галерея */}
          <div className="lg:col-span-7 space-y-8">
            <div className="neon-card bg-slate-950 border border-slate-800 rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
              <div className="aspect-[4/3] relative">
                <img 
                  src={image} 
                  alt={product.images[0]?.alt || product.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                />
              </div>
              <div className="absolute top-8 left-8 flex flex-col gap-2">
                {product.stock > 0 ? (
                  <Badge variant="success" className="shadow-2xl backdrop-blur-md bg-green-500/20 border-green-500/30 px-6 py-2 text-[10px] font-black uppercase tracking-widest">В наличии</Badge>
                ) : product.allowPreorder ? (
                  <Badge variant="warning" className="shadow-2xl backdrop-blur-md bg-yellow-500/20 border-yellow-500/30 px-6 py-2 text-[10px] font-black uppercase tracking-widest">Под заказ</Badge>
                ) : (
                  <Badge variant="error" className="shadow-2xl backdrop-blur-md bg-red-500/20 border-red-500/30 px-6 py-2 text-[10px] font-black uppercase tracking-widest">Нет в наличии</Badge>
                )}
              </div>
            </div>
            
            {product.images.length > 1 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {product.images.slice(0, 12).map((img) => (
                  <div key={img.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-square cursor-pointer hover:border-primary/50 transition-all hover:-translate-y-1">
                    <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}

            <ProductDetails description={product.description || product.shortDescription || ""} characteristics={characteristics} />
          </div>

          {/* Инфо и Покупка */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-10">
              <div className="space-y-6">
                <div className="inline-block px-3 py-1 bg-primary/5 border border-primary/20 rounded-lg text-[9px] font-black text-primary uppercase tracking-[0.3em]">
                  {product.category?.name || "Reality3D Store"}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight uppercase">
                  {product.name}
                </h1>
                {product.sku && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800 text-[10px] font-mono text-gray-500 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800 animate-pulse"></span>
                    SKU: {product.sku}
                  </div>
                )}
              </div>

              <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-slate-800 space-y-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/[0.01] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10 flex items-end gap-6">
                  <div className="text-6xl font-black text-white tracking-tighter text-glow">
                    {formatRub(product.priceKopeks)}
                  </div>
                  {product.compareAtKopeks ? (
                    <div className="text-2xl text-gray-700 line-through mb-2.5 font-bold">
                      {formatRub(product.compareAtKopeks)}
                    </div>
                  ) : null}
                </div>

                <div className="relative z-10 space-y-6">
                  <AddToCartButton 
                    productId={product.id} 
                    disabled={isOutOfStock}
                    className="w-full h-20 rounded-[1.25rem] text-xl font-black shadow-[0_0_30px_rgba(255,94,0,0.2)] hover:shadow-[0_0_50px_rgba(255,94,0,0.4)] transition-all duration-500 uppercase tracking-widest"
                  />
                  <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-primary/60" />
                      Безопасная оплата
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-primary/60" />
                      Доставка по РФ
                    </div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 gap-6 pt-10 border-t border-slate-800/50">
                  <div className="flex items-center gap-5 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 text-primary border border-white/5 shadow-inner group-hover/item:bg-primary/5 transition-colors">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">Быстрая доставка</div>
                      <div className="text-[10px] text-gray-600 mt-1 font-medium">СДЭК, Яндекс или самовывоз в СПб</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center shrink-0 text-blue-400 border border-white/5 shadow-inner group-hover/item:bg-blue-400/5 transition-colors">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">Гарантия качества</div>
                      <div className="text-[10px] text-gray-600 mt-1 font-medium">Проверка каждого товара перед отправкой</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-12">
          <div className="flex items-center justify-between border-b border-slate-800 pb-8">
             <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">С этим покупают</h2>
                <p className="text-gray-600 mt-1 font-bold uppercase tracking-widest text-[10px]">Recommended products for you</p>
             </div>
             <Link href="/shop" className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-[0.2em]">Смотреть все →</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <Link 
                key={p.id} 
                href={`/shop/${p.slug}`}
                className="group relative neon-card border border-slate-800 bg-slate-900/40 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,94,0,0.1)] flex flex-col"
              >
                <div className="aspect-[4/3] relative bg-slate-950 overflow-hidden">
                   <img 
                      src={p.images[0]?.url || "/grid.svg"} 
                      alt={p.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60"></div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                   <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">
                      {p.category?.name || "Store"}
                   </div>
                   <h3 className="text-lg font-black text-white mb-4 line-clamp-1 group-hover:text-primary transition-colors tracking-tight uppercase">{p.name}</h3>
                   <div className="mt-auto flex items-center justify-between gap-4">
                      <div className="text-xl font-black text-white tracking-tighter">
                         {formatRub(p.priceKopeks)}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                         <ShoppingCart className="w-4 h-4" />
                      </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
