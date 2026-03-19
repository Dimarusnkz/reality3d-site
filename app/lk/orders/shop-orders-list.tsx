"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getShopOrderStatusMeta, getShopPaymentStatusMeta, getShopPaymentProviderLabel } from "@/lib/shop/order-status";
import { cn } from "@/lib/utils";
import { formatRub } from "@/lib/shop/money";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton, Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "payment">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.orderNo.toString().includes(searchTerm);
      if (!matchesSearch) return false;

      if (filter === "active") {
        return !["completed", "cancelled"].includes(o.status);
      }
      if (filter === "completed") {
        return ["completed", "cancelled"].includes(o.status);
      }
      if (filter === "payment") {
        return o.paymentStatus === "unpaid";
      }
      return true;
    });
  }, [orders, filter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Заказы магазина
            <Badge variant="secondary" className="font-mono">SHOP</Badge>
          </h2>
          <p className="text-sm text-gray-400 mt-1">История покупок в магазине</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Поиск по номеру..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: "Все" },
          { id: "active", label: "Активные" },
          { id: "payment", label: "Ожидают оплаты" },
          { id: "completed", label: "Завершённые" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border",
              filter === f.id 
                ? "bg-primary/10 text-primary border-primary/30" 
                : "bg-slate-900/40 text-gray-400 border-slate-800 hover:text-white hover:bg-slate-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="neon-card rounded-2xl overflow-hidden border border-slate-800/50">
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Пока нет заказов магазина"
            description="Перейдите в магазин, добавьте товары в корзину и оформите заказ."
            actions={
              <LinkButton href="/shop" size="sm">
                Перейти в магазин
              </LinkButton>
            }
          />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Заказы не найдены"
            description="Попробуйте изменить параметры поиска или фильтры."
            actions={
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setFilter("all"); }}>
                Сбросить фильтры
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-slate-900/30 border-b border-slate-800/50">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Заказ</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Статус</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Оплата</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Сумма</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {filteredOrders.map((o) => {
                  const date = typeof o.createdAt === "string" ? new Date(o.createdAt) : o.createdAt;
                  const status = getShopOrderStatusMeta(o.status);
                  const pay = getShopPaymentStatusMeta(o.paymentStatus);
                  const isUnpaid = o.paymentStatus === "unpaid";

                  return (
                    <tr key={o.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-white text-base">#{o.orderNo}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{date.toLocaleDateString("ru-RU")}</div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={
                          o.status === "completed" ? "success" : 
                          o.status === "cancelled" ? "error" : "info"
                        }>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <Badge variant={o.paymentStatus === "paid" ? "success" : "warning"}>
                            {pay.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-white text-base">{formatRub(o.totalKopeks)}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUnpaid && (
                            <LinkButton 
                              href={`/shop/order/${o.id}?pay=1`} 
                              size="sm" 
                              className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                            >
                              Оплатить
                            </LinkButton>
                          )}
                          <LinkButton 
                              href={`/shop/order/${o.id}`}
                              variant="secondary"
                              size="sm"
                              className="group-hover:bg-slate-700"
                          >
                             <Eye className="h-4 w-4" />
                             <span className="ml-2 hidden md:inline">Открыть</span>
                          </LinkButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
