import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { PICKUP_ADDRESS, PICKUP_PHONE, getShippingMethodLabel } from "@/lib/shop/shipping";
import { cn } from "@/lib/utils";
import { getShopOrderStatusMeta, getShopPaymentAttemptStatusMeta, getShopPaymentProviderLabel, getShopPaymentStatusMeta } from "@/lib/shop/order-status";
import { PayTbankButton } from "../pay-tbank-button";
import { PayTbankLinkButton } from "../pay-tbank-link-button";
import { OrderLayout, OrderSection, OrderInfoRow } from "@/components/order/order-layout";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default async function ShopOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; token?: string; justCreated?: string }>;
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
  const showPay = !isPaid && (order.paymentProvider === "tbank_link" || order.paymentProvider === "tbank");
  const statusMeta = getShopOrderStatusMeta(order.status);
  const payMeta = getShopPaymentStatusMeta(order.paymentStatus);

  const steps = [
    { 
      title: "Заказ", 
      isCompleted: ["paid", "shipped", "completed"].includes(order.status) || order.paymentStatus === "paid",
      isActive: order.status === "pending" && order.paymentStatus === "unpaid"
    },
    { 
      title: "Оплата", 
      isCompleted: order.paymentStatus === "paid",
      isActive: order.paymentStatus === "unpaid" && order.status !== "cancelled"
    },
    { 
      title: "Сборка", 
      isCompleted: ["shipped", "completed"].includes(order.status),
      isActive: order.paymentStatus === "paid" && order.status === "pending"
    },
    { 
      title: "Доставка", 
      isCompleted: order.status === "completed",
      isActive: order.status === "shipped"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {sp.justCreated === "1" && (
        <div className="mb-10 p-8 rounded-3xl bg-green-500/10 border border-green-500/20 text-center animate-in fade-in slide-in-from-top-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Заказ успешно оформлен!</h2>
          <p className="text-gray-400">Спасибо за покупку в Reality3D. Мы уже начали подготовку вашего заказа.</p>
        </div>
      )}
      <OrderLayout
        title={`Заказ #${order.orderNo}`}
        subtitle={`От ${order.createdAt.toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        backUrl="/lk/orders"
        backLabel="Все заказы"
        statusBadge={<Badge variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "error" : "info"}>{statusMeta.label}</Badge>}
        paymentBadge={<Badge variant={order.paymentStatus === "paid" ? "success" : "warning"}>{payMeta.label}</Badge>}
        statusSteps={steps}
        mainContent={
          <div className="space-y-6 md:space-y-8">
          {sp.payment === "failed" ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm">
              Оплата не прошла. Попробуй ещё раз или выбери другой способ.
            </div>
          ) : null}

          {isPaid ? (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4 text-sm">
              Оплата получена. Мы свяжемся с вами для подтверждения.
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-gray-300">
                Заказ создан, но не оплачен. Сумма: <span className="text-white font-bold">{formatRub(order.totalKopeks)}</span>
              </div>
              {showPay ? (
                order.paymentProvider === "tbank" ? (
                  <PayTbankButton orderId={order.id} publicAccessToken={isGuestAccess ? sp.token : null} />
                ) : (
                  <PayTbankLinkButton />
                )
              ) : null}
            </div>
          )}

          <OrderSection title="Состав заказа">
            <div className="divide-y divide-slate-800/50 -mx-4 md:-mx-5 px-4 md:px-5">
              {order.items.map((i) => (
                <div key={i.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="text-white">
                    {i.productName} <span className="text-gray-500">× {i.quantity}</span>
                    {i.sku ? <div className="text-xs text-gray-500 font-mono mt-1">{i.sku}</div> : null}
                  </div>
                  <div className="text-white font-semibold">{formatRub(i.totalKopeks)}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/50 flex items-center justify-between">
              <span className="text-gray-400">Итого</span>
              <span className="text-white font-bold text-lg">{formatRub(order.totalKopeks)}</span>
            </div>
          </OrderSection>
        </div>
      }
      sidebarContent={
        <div className="space-y-6">
          <OrderSection title="Контакты">
            <OrderInfoRow label="Имя" value={order.contactName || "—"} />
            <OrderInfoRow label="Телефон" value={order.contactPhone || "—"} />
            <OrderInfoRow label="Email" value={order.contactEmail || "—"} />
          </OrderSection>

          <OrderSection title="Доставка">
            <OrderInfoRow 
              label="Способ" 
              value={getShippingMethodLabel(order.shippingMethod)} 
            />
            {order.shippingMethod === "pickup" ? (
              <OrderInfoRow 
                label="Адрес самовывоза" 
                value={PICKUP_ADDRESS} 
                subvalue={`Телефон: ${PICKUP_PHONE}`} 
              />
            ) : (
              <OrderInfoRow 
                label="Адрес доставки" 
                value={`${order.deliveryCity || "—"}, ${order.deliveryAddress || "—"}`} 
                subvalue={
                  <div className="space-y-1 mt-1">
                    {order.deliveryPostalCode && <div>Индекс: {order.deliveryPostalCode}</div>}
                    <div>Телефон: {order.deliveryPhone || order.contactPhone || "—"}</div>
                    {order.shippingTrackingNo && <div>Трек: {order.shippingTrackingNo}</div>}
                    {(order.shippingMethod === "cdek" || order.shippingMethod === "yandex") && (
                      <div>
                        Стоимость:{" "}
                        {typeof order.shippingQuoteMinKopeks === "number" && typeof order.shippingQuoteMaxKopeks === "number"
                          ? `${formatRub(order.shippingQuoteMinKopeks)}–${formatRub(order.shippingQuoteMaxKopeks)} (по тарифу)`
                          : "по тарифу (уточним)"}
                      </div>
                    )}
                  </div>
                }
              />
            )}
          </OrderSection>

          <OrderSection title="Платежи">
            {order.payments.length === 0 ? (
              <div className="text-gray-500 text-sm">Пока нет</div>
            ) : (
              <div className="space-y-3">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="text-gray-300">
                      {getShopPaymentProviderLabel(p.provider)}{" "}
                      <span className={cn("text-xs", getShopPaymentAttemptStatusMeta(p.status).className)}>
                        ({getShopPaymentAttemptStatusMeta(p.status).label})
                      </span>
                    </div>
                    <div className="text-white font-medium">{formatRub(p.amountKopeks)}</div>
                  </div>
                ))}
              </div>
            )}
          </OrderSection>
        </div>
      }
    />
    </div>
  );
}
