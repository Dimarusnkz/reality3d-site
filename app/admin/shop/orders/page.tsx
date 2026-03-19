import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { getShippingMethodLabel } from "@/lib/shop/shipping";
import { cn } from "@/lib/utils";
import { getShopOrderStatusMeta, getShopPaymentProviderLabel, getShopPaymentStatusMeta } from "@/lib/shop/order-status";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Search, Download, User, Truck, CreditCard } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Заказы магазина</h1>
          <p className="text-gray-400 mt-1">Управление продажами и платежами</p>
        </div>
        <LinkButton
          href={`/api/admin/shop/orders/export?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`}
          variant="secondary"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Экспорт CSV
        </LinkButton>
      </div>

      <form action="/admin/shop/orders" className="neon-card p-5 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Поиск: телефон / email / адрес"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-primary outline-none transition-all text-sm"
          />
        </div>
        <select 
          name="status" 
          defaultValue={status} 
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none transition-all text-sm appearance-none cursor-pointer min-w-[180px]"
        >
          <option value="">Все статусы</option>
          <option value="pending">В обработке</option>
          <option value="paid">Оплачен</option>
          <option value="cancelled">Отменён</option>
          <option value="shipped">Отправлен</option>
          <option value="completed">Завершён</option>
        </select>
        <Button size="sm" className="md:w-32">Найти</Button>
      </form>

      <div className="neon-card rounded-2xl overflow-hidden border border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 bg-slate-950 border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Заказ</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Покупатель</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Доставка</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Оплата</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {orders.map((o) => {
                const statusMeta = getShopOrderStatusMeta(o.status);
                const payMeta = getShopPaymentStatusMeta(o.paymentStatus);
                
                return (
                  <tr key={o.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <Link href={`/admin/shop/orders/${o.id}`} className="font-bold text-white text-base hover:text-primary transition-colors">
                        #{o.orderNo}
                      </Link>
                      <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tight">
                        {new Date(o.createdAt).toLocaleDateString("ru-RU")}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <Badge variant={o.status === "completed" ? "secondary" : o.status === "cancelled" ? "error" : "info"}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {o.user ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-primary">
                            {(o.user.name || o.user.email || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-bold">{o.user.name || "Без имени"}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{o.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 grayscale opacity-50">
                           <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                             <User className="w-4 h-4 text-gray-500" />
                           </div>
                           <span className="text-gray-500 text-xs italic">Гость</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-300 font-medium">
                        <Truck className="w-3.5 h-3.5 text-gray-500" />
                        {getShippingMethodLabel(o.shippingMethod)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 truncate max-w-[180px]">
                        {o.shippingMethod === "pickup" ? "Самовывоз из студии" : o.deliveryCity || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-white font-bold">
                        <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                        <Badge variant={o.paymentStatus === "paid" ? "success" : "warning"} className="px-1.5 py-0">
                          {payMeta.label}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-tight">
                        {getShopPaymentProviderLabel(o.paymentProvider)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="text-lg font-black text-white tracking-tight">
                        {formatRub(o.totalKopeks)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
              <Search className="w-8 h-8 text-gray-700" />
            </div>
            <p className="text-gray-500 font-medium text-lg">Заказы не найдены</p>
            <p className="text-gray-600 text-sm mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
