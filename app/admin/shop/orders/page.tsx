import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { getShippingMethodLabel } from "@/lib/shop/shipping";
import { cn } from "@/lib/utils";
import { getShopOrderStatusMeta, getShopPaymentProviderLabel, getShopPaymentStatusMeta } from "@/lib/shop/order-status";

type SearchParams = { q?: string; status?: string };

export default async function AdminShopOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const prisma = getPrisma();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const status = (sp.status || "").trim();
  const orders = await prisma.shopOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { contactPhone: { contains: q } },
              { contactEmail: { contains: q, mode: "insensitive" } },
              { deliveryPhone: { contains: q } },
              { deliveryAddress: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { user: { select: { id: true, email: true, name: true } }, payments: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Заказы магазина</h1>
        <Link
          href={`/api/admin/shop/orders/export?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Экспорт CSV
        </Link>
      </div>

      <form action="/admin/shop/orders" className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск: телефон / email / адрес"
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
        />
        <select name="status" defaultValue={status} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white">
          <option value="">Все статусы</option>
          <option value="pending">В обработке</option>
          <option value="paid">Оплачен</option>
          <option value="cancelled">Отменён</option>
          <option value="shipped">Отправлен</option>
          <option value="completed">Завершён</option>
        </select>
        <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors">Найти</button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">Заказ</th>
              <th className="text-left p-4 text-gray-400 font-medium">Покупатель</th>
              <th className="text-left p-4 text-gray-400 font-medium">Доставка</th>
              <th className="text-left p-4 text-gray-400 font-medium">Оплата</th>
              <th className="text-right p-4 text-gray-400 font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <Link href={`/admin/shop/orders/${o.id}`} className="text-white font-semibold hover:text-primary transition-colors">
                    #{o.orderNo}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(o.createdAt).toLocaleString("ru-RU")}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", getShopPaymentStatusMeta(o.paymentStatus).className)}>
                      {getShopPaymentStatusMeta(o.paymentStatus).label}
                    </span>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", getShopOrderStatusMeta(o.status).className)}>
                      {getShopOrderStatusMeta(o.status).label}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-gray-300">
                  {o.user ? (
                    <div>
                      <div className="text-white">{o.user.name || o.user.email}</div>
                      <div className="text-xs text-gray-500">{o.user.email}</div>
                    </div>
                  ) : (
                    <div className="text-gray-500">—</div>
                  )}
                </td>
                <td className="p-4 text-gray-300">
                  <div className="text-white">{getShippingMethodLabel(o.shippingMethod)}</div>
                  {o.shippingMethod === "pickup" ? (
                    <div className="text-xs text-gray-500">Самовывоз</div>
                  ) : o.shippingMethod === "cdek" || o.shippingMethod === "yandex" ? (
                    <div className="text-xs text-gray-500">по тарифу (уточним)</div>
                  ) : (
                    <div className="text-xs text-gray-500">{o.deliveryCity || "—"}</div>
                  )}
                </td>
                <td className="p-4 text-gray-300">
                  <div className="text-white">{getShopPaymentProviderLabel(o.paymentProvider)}</div>
                  <div className="text-xs text-gray-500">{getShopPaymentStatusMeta(o.paymentStatus).label}</div>
                </td>
                <td className="p-4 text-right text-white font-semibold">{formatRub(o.totalKopeks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <div className="p-8 text-center text-gray-500">Нет заказов</div> : null}
      </div>
    </div>
  );
}
