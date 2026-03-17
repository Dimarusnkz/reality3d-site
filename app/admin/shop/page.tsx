import Link from "next/link";

export default function AdminShopPage() {
  const cards = [
    {
      href: "/admin/shop/products",
      title: "Карточки товаров",
      desc: "Фото, описание, оформление",
    },
    {
      href: "/admin/shop/orders",
      title: "Заказы магазина",
      desc: "Статусы, доставка, оплата",
    },
    {
      href: "/admin/shop/payments",
      title: "Платежи",
      desc: "ТБанк/ЮKassa и прочие способы",
    },
    {
      href: "/admin/warehouse/catalog",
      title: "Каталог (склад)",
      desc: "Товары, цены, остатки, категории",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Магазин</h1>
        <Link
          href="/shop"
          target="_blank"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Открыть магазин
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors"
          >
            <div className="text-white font-semibold text-lg">{c.title}</div>
            <div className="text-sm text-gray-400 mt-2">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
