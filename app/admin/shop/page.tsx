import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Package, ShoppingCart, CreditCard, Database, ArrowRight } from "lucide-react";

export default function AdminShopPage() {
  const cards = [
    {
      href: "/admin/shop/products",
      title: "Карточки товаров",
      desc: "Фото, описание, оформление витрины",
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      href: "/admin/shop/orders",
      title: "Заказы магазина",
      desc: "Статусы, доставка, работа с покупателями",
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10"
    },
    {
      href: "/admin/shop/payments",
      title: "Платежи",
      desc: "ТБанк/ЮKassa и история транзакций",
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      href: "/admin/warehouse/catalog",
      title: "Каталог (склад)",
      desc: "Цены, остатки, категории и закупки",
      icon: Database,
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">Управление магазином</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">E-commerce Control Center</p>
        </div>
        <LinkButton
          href="/shop"
          target="_blank"
          variant="secondary"
          size="sm"
          className="font-bold uppercase tracking-widest text-[10px]"
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          Открыть магазин
        </LinkButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative neon-card border border-slate-800 bg-slate-900/40 p-8 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
              <c.icon className={cn("w-24 h-24", c.color)} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner", c.bg)}>
                <c.icon className={cn("w-6 h-6", c.color)} />
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-primary transition-colors">{c.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[240px]">{c.desc}</p>
              </div>
              
              <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-primary transition-colors">
                Управление <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
