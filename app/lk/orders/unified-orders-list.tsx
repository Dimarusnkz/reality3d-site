"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calculator, Eye, Plus, Search, ShoppingCart } from "lucide-react";
import { LinkButton, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { getCalcOrderStatusMeta } from "@/lib/orders/calc-order-status";
import { getShopOrderStatusMeta, getShopPaymentStatusMeta } from "@/lib/shop/order-status";
import { formatRub } from "@/lib/shop/money";
import { CreateOrderModal } from "./create-order-modal";

type UnifiedRow =
  | {
      kind: "calc";
      createdAt: string | Date;
      id: number;
      title: string | null;
      status: string;
      price: number | null;
    }
  | {
      kind: "shop";
      createdAt: string | Date;
      id: string;
      orderNo: number;
      status: string;
      paymentStatus: string;
      paymentProvider: string | null;
      totalKopeks: number;
    };

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export default function UnifiedOrdersList({ calcOrders, shopOrders }: { calcOrders: any[]; shopOrders: any[] }) {
  const searchParams = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "new") setIsCreateModalOpen(true);
  }, [searchParams]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "calc" | "shop">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "payment" | "completed">("all");

  const rows = useMemo<UnifiedRow[]>(() => {
    const calc = (calcOrders || []).map((o: any) => ({
      kind: "calc" as const,
      createdAt: o.createdAt,
      id: o.id,
      title: o.title ?? null,
      status: o.status ?? "pending",
      price: typeof o.price === "number" ? o.price : o.price == null ? null : Number(o.price),
    }));
    const shop = (shopOrders || []).map((o: any) => ({
      kind: "shop" as const,
      createdAt: o.createdAt,
      id: o.id,
      orderNo: o.orderNo,
      status: o.status ?? "pending",
      paymentStatus: o.paymentStatus ?? "unpaid",
      paymentProvider: o.paymentProvider ?? null,
      totalKopeks: o.totalKopeks ?? 0,
    }));
    return [...calc, ...shop].sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
  }, [calcOrders, shopOrders]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.kind !== typeFilter) return false;

      const matchesSearch =
        q.length === 0 ||
        (r.kind === "calc"
          ? String(r.id).includes(q) || String(r.title || "").toLowerCase().includes(q)
          : String(r.orderNo).includes(q) || String(r.id).toLowerCase().includes(q));
      if (!matchesSearch) return false;

      const isCompleted = r.kind === "shop" ? ["completed", "cancelled"].includes(String(r.status)) : ["completed", "cancelled"].includes(String(r.status));
      const isPaymentPending =
        r.kind === "shop" ? String(r.paymentStatus) === "unpaid" : String(r.status) === "payment_pending";
      const isActive = !isCompleted;

      if (statusFilter === "active") return isActive;
      if (statusFilter === "completed") return isCompleted;
      if (statusFilter === "payment") return isPaymentPending;
      return true;
    });
  }, [rows, searchTerm, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Заказы</h2>
          <p className="text-sm text-gray-400 mt-1">Управление заказами 3D‑печати и покупками в магазине</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Поиск по номеру или названию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Новый проект</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "Все" },
          { id: "active", label: "Активные" },
          { id: "payment", label: "Ожидают оплаты" },
          { id: "completed", label: "Завершённые" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id as any)}
            className={cn(
              "px-4 py-2 text-sm rounded-lg font-medium transition-colors",
              statusFilter === f.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-slate-900 text-gray-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px h-10 bg-slate-800 mx-1 hidden sm:block" />
        {[
          { id: "all", label: "Все источники" },
          { id: "calc", label: "3D‑печать" },
          { id: "shop", label: "Магазин" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setTypeFilter(f.id as any)}
            className={cn(
              "px-4 py-2 text-sm rounded-lg font-medium transition-colors",
              typeFilter === f.id
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-slate-900 text-gray-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Заказов пока нет"
          description="Создайте проект 3D‑печати или оформите покупку в магазине."
          actions={
            <div className="flex flex-wrap gap-2 justify-center">
              <LinkButton href="/calculator" size="sm">
                Рассчитать печать
              </LinkButton>
              <LinkButton href="/shop" variant="secondary" size="sm">
                Перейти в магазин
              </LinkButton>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Заказы не найдены"
          description="Попробуйте изменить параметры поиска или фильтры."
          actions={
            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(""); setTypeFilter("all"); setStatusFilter("all"); }}>
              Сбросить фильтры
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 bg-slate-900/30 border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Источник</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Заказ</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Статус</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Оплата</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Сумма</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filtered.map((r) => {
                const createdAt = toDate(r.createdAt);

                if (r.kind === "shop") {
                  const s = getShopOrderStatusMeta(r.status);
                  const p = getShopPaymentStatusMeta(r.paymentStatus);
                  const isUnpaid = String(r.paymentStatus) === "unpaid";
                  return (
                    <tr key={`shop:${r.id}`} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1">
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Магазин
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-white">
                          <Link href={`/shop/order/${r.id}`} className="hover:text-primary transition-colors">
                            Заказ #{r.orderNo}
                          </Link>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{createdAt.toLocaleDateString("ru-RU")}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", s.className)}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", p.className)}>
                          {p.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-white text-base">{formatRub(r.totalKopeks)}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUnpaid && (
                            <LinkButton
                              href={`/shop/order/${r.id}?pay=1`}
                              size="sm"
                              className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                            >
                              Оплатить
                            </LinkButton>
                          )}
                          <LinkButton href={`/shop/order/${r.id}`} variant="secondary" size="sm" className="group-hover:bg-slate-700">
                            <Eye className="h-4 w-4" />
                            <span className="ml-2 hidden md:inline">Открыть</span>
                          </LinkButton>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const s = getCalcOrderStatusMeta(r.status);
                const isWaitingPayment = String(r.status) === "payment_pending";
                const paymentLabel = r.status === "paid" ? "Оплачен" : isWaitingPayment ? "Ожидает оплаты" : "—";
                const paymentClassName =
                  r.status === "paid"
                    ? "text-green-400 bg-green-500/10 border border-green-500/20"
                    : isWaitingPayment
                      ? "text-orange-400 bg-orange-500/10 border border-orange-500/20"
                      : "text-gray-300 bg-slate-500/10 border border-slate-500/20";

                return (
                  <tr key={`calc:${r.id}`} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
                        <Calculator className="h-3.5 w-3.5" />
                        3D‑печать
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-white truncate max-w-[320px]">
                        <Link href={`/lk/orders/${r.id}`} className="hover:text-primary transition-colors">
                          {r.title || `Заказ #${r.id}`}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{createdAt.toLocaleDateString("ru-RU")}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", s.className)}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-medium", paymentClassName)}>
                        {paymentLabel}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-white text-base">
                        {r.price && r.price > 0 ? `${r.price.toLocaleString("ru-RU")} ₽` : "На расчёте"}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isWaitingPayment && (
                          <LinkButton
                            href={`/lk/orders/${r.id}`}
                            size="sm"
                            className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                          >
                            Оплатить
                          </LinkButton>
                        )}
                        <LinkButton href={`/lk/orders/${r.id}`} variant="secondary" size="sm" className="group-hover:bg-slate-700">
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

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

