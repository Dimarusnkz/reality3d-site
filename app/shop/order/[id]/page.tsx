import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { PICKUP_ADDRESS, PICKUP_PHONE, getShippingMethodLabel } from "@/lib/shop/shipping";
import { PayTbankButton } from "../pay-tbank-button";

export default async function ShopOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; token?: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const sp = await searchParams;
  const userId = session?.userId ? parseInt(session.userId, 10) : null;

  const prisma = getPrisma();
  const order = await prisma.shopOrder.findUnique({
    where: { id },
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 5 } },
  });
  if (!order) notFound();

  const isGuestAccess = !session?.userId;
  if (isGuestAccess) {
    if (order.userId) redirect("/login");
    if (!sp.token || !order.publicAccessToken || sp.token !== order.publicAccessToken) notFound();
  } else {
    if (order.userId !== userId && session?.role !== "admin") notFound();
  }

  const isPaid = order.paymentStatus === "paid" || order.status === "paid";

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Заказ #{order.orderNo}</h1>
        <div className="text-sm text-gray-400">
          Статус: <span className="text-white font-medium">{order.status}</span>
          <span className="mx-2">•</span>
          Оплата: <span className="text-white font-medium">{order.paymentStatus}</span>
        </div>
      </div>

      {sp.payment === "failed" ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
          Оплата не прошла. Попробуй ещё раз или выбери другой способ.
        </div>
      ) : null}

      {isPaid ? (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4">
          Оплата получена. Мы свяжемся с вами для подтверждения.
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-gray-300">
            Заказ создан, но не оплачен. Сумма: <span className="text-white font-bold">{formatRub(order.totalKopeks)}</span>
          </div>
          {order.paymentProvider === "tbank" ? <PayTbankButton orderId={order.id} publicAccessToken={isGuestAccess ? sp.token : null} /> : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950 text-gray-400 text-sm">Состав заказа</div>
            <div className="divide-y divide-slate-800">
              {order.items.map((i) => (
                <div key={i.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="text-white">
                    {i.productName} <span className="text-gray-500">× {i.quantity}</span>
                    {i.sku ? <div className="text-xs text-gray-500 font-mono mt-1">{i.sku}</div> : null}
                  </div>
                  <div className="text-white font-semibold">{formatRub(i.totalKopeks)}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-gray-400">Итого</span>
              <span className="text-white font-bold">{formatRub(order.totalKopeks)}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="text-gray-400 text-sm">Доставка</div>
            <div className="text-white font-medium">{getShippingMethodLabel(order.shippingMethod)}</div>
            {order.shippingMethod === "pickup" ? (
              <div className="text-gray-300 text-sm">
                <div>{PICKUP_ADDRESS}</div>
                <div className="text-xs text-gray-500 mt-1">Телефон: {PICKUP_PHONE}</div>
              </div>
            ) : (
              <div className="text-gray-300 text-sm">
                <div>{order.deliveryCity || "—"}</div>
                <div>{order.deliveryAddress || "—"}</div>
                <div className="text-xs text-gray-500 mt-1">Индекс: {order.deliveryPostalCode || "—"}</div>
                <div className="text-xs text-gray-500 mt-1">Телефон: {order.deliveryPhone || order.contactPhone || "—"}</div>
                {order.shippingMethod === "cdek" || order.shippingMethod === "yandex" ? (
                  <div className="text-xs text-gray-500 mt-1">Стоимость: по тарифу (уточним)</div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-2">
            <div className="text-gray-400 text-sm">Контакты</div>
            <div className="text-white">{order.contactName || "—"}</div>
            <div className="text-gray-300 text-sm">{order.contactPhone || "—"}</div>
            <div className="text-gray-300 text-sm">{order.contactEmail || "—"}</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="text-gray-400 text-sm">Платежи</div>
            {order.payments.length === 0 ? (
              <div className="text-gray-500 text-sm">Пока нет</div>
            ) : (
              <div className="space-y-2 text-sm">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="text-gray-300">
                      {p.provider} <span className="text-gray-500">({p.status})</span>
                    </div>
                    <div className="text-white font-medium">{formatRub(p.amountKopeks)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            <Link href="/shop" className="text-primary hover:underline">
              Вернуться в магазин
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
