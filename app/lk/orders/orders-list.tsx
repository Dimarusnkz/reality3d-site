"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Eye, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateOrderModal } from "./create-order-modal";
import { cn } from "@/lib/utils";
import { getCalcOrderStatusMeta } from "@/lib/orders/calc-order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton, Button } from "@/components/ui/button";
import Link from "next/link";

export default function OrdersList({ initialOrders }: { initialOrders: any[] }) {
  const searchParams = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
        setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "payment">("all");

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.id.toString().includes(searchTerm);
      
      if (!matchesSearch) return false;
      
      if (filter === "active") {
        return !["completed", "cancelled"].includes(order.status);
      }
      if (filter === "completed") {
        return ["completed", "cancelled"].includes(order.status);
      }
      if (filter === "payment") {
        return order.status === "payment_pending";
      }
      return true;
    });
  }, [orders, searchTerm, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Заказы 3D‑печати
            <Badge variant="secondary" className="font-mono">CALC</Badge>
          </h2>
          <p className="text-sm text-gray-400 mt-1">Индивидуальные проекты и расчёты</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
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
             <span className="hidden sm:inline">Новый заказ</span>
          </button>
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
        {filteredOrders.length === 0 ? (
            <EmptyState
              icon={Package}
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
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Название</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Статус</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Сумма</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredOrders.map((order) => {
                const s = getCalcOrderStatusMeta(order.status);
                const isWaitingPayment = order.status === "payment_pending";
                
                return (
                  <tr key={order.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-white text-base">#{order.id}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{order.title || "Проект 3D‑печати"}</div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={
                        order.status === "completed" ? "success" : 
                        order.status === "cancelled" ? "error" : 
                        order.status === "payment_pending" ? "warning" : "info"
                      }>
                        {s.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-white text-base">
                        {order.price && order.price > 0 ? `${order.price.toLocaleString()} ₽` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isWaitingPayment && (
                          <LinkButton 
                            href={`/lk/orders/${order.id}`} 
                            size="sm" 
                            className="bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                          >
                            Оплатить
                          </LinkButton>
                        )}
                        <LinkButton 
                            href={`/lk/orders/${order.id}`}
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

      <CreateOrderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
            // In a real app with server components, we might rely on router.refresh() 
            // handled by the create action, but here we might want to refresh explicitly if needed.
            // Since we used revalidatePath in action, simple refresh or just waiting for next render is ok.
            // But for immediate feedback, we might want to refetch or update state. 
            // For now, let's just assume the parent component or next navigation handles it, 
            // OR we can trigger a router refresh.
            window.location.reload(); // Simple brute force refresh for now
        }}
      />
    </div>
  );
}
