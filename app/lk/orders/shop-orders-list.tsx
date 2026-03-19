"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getShopOrderStatusMeta, getShopPaymentStatusMeta, getShopPaymentProviderLabel } from "@/lib/shop/order-status";
import { cn } from "@/lib/utils";
import { formatRub } from "@/lib/shop/money";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

type ShopOrderRow = {
  id: string;
  orderNo: number;
  createdAt: string | Date;
  status: string;
  paymentStatus: string;
  paymentProvider: string | null;
  totalKopeks: number;
};

export default function ShopOrdersList({ orders }: { orders: ShopOrderRow[] }) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filter === "active") {
        return !["completed", "cancelled"].includes(o.status);
      }
      if (filter === "completed") {
        return ["completed", "cancelled"].includes(o.status);
      }
      return true;
    });
  }, [orders, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Заказы магазина</h2>
          <p className="text-gray-400">История заказов из магазина</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setFilter("all")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors", filter === "all" ? "bg-primary text-white" : "bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800")}
        >
          Все заказы
        </button>
        <button
          onClick={() => setFilter("active")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors", filter === "active" ? "bg-primary text-white" : "bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800")}
        >
          Активные
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors", filter === "completed" ? "bg-primary text-white" : "bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800")}
        >
          Завершённые
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl">
          <EmptyState
            icon={ShoppingCart}
            title="Пока нет заказов магазина"
            description="Перейдите в магазин, добавьте товары в корзину и оформите заказ. История будет отображаться здесь."
            actions={
              <>
                <ButtonLink href="/shop" size="sm">
                  Перейти в магазин
                </ButtonLink>
                <ButtonLink href="/checkout" variant="outline" size="sm">
                  В корзину
                </ButtonLink>
              </>
            }
          />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl">
          <EmptyState
            icon={ShoppingCart}
            title="Нет подходящих заказов"
            description="В этой категории пока нет заказов."
          />
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">№</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Дата</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Оплата</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Сумма</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/50 divide-y divide-slate-800">
              {filteredOrders.map((o) => {
                const date = typeof o.createdAt === "string" ? new Date(o.createdAt) : o.createdAt;
                const status = getShopOrderStatusMeta(o.status);
                const pay = getShopPaymentStatusMeta(o.paymentStatus);
                return (
                  <tr key={o.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      <Link href={`/shop/order/${o.id}`} className="hover:underline">
                        #{o.orderNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{date.toLocaleString("ru-RU")}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", status.className)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className={cn("inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium", pay.className)}>
                          {pay.label}
                        </span>
                        <span className="text-xs text-gray-500">{getShopPaymentProviderLabel(o.paymentProvider)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-semibold">{formatRub(o.totalKopeks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
