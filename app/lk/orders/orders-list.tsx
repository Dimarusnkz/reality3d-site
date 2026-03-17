"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateOrderModal } from "./create-order-modal";
import { ClientOrderDetailsModal } from "./client-order-details";
import { useSearchParams } from "next/navigation";

type OrderStatus = 'pending' | 'processing' | 'payment_pending' | 'paid' | 'in_production' | 'ready' | 'completed' | 'shipped' | 'cancelled';

const STATUSES: Record<OrderStatus | string, { label: string; color: string; bg: string }> = {
  pending: { label: 'На проверке', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  processing: { label: 'В работе', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  payment_pending: { label: 'Ожидает оплаты', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  paid: { label: 'Оплачен', color: 'text-green-400', bg: 'bg-green-500/10' },
  in_production: { label: 'В производстве', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ready: { label: 'Готов к выдаче', color: 'text-secondary', bg: 'bg-secondary/10' },
  completed: { label: 'Завершен', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  shipped: { label: 'Отправлен', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  cancelled: { label: 'Отменен', color: 'text-red-400', bg: 'bg-red-500/10' },
};

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
  const [orders] = useState(initialOrders);

  const filteredOrders = orders.filter(order => 
    order.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Мои заказы</h1>
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
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-[0_0_15px_rgba(255,94,0,0.3)]"
          >
             <Plus className="h-5 w-5" />
             <span className="hidden sm:inline">Новый заказ</span>
          </button>
        </div>
      </div>

      <div className="neon-card rounded-xl overflow-hidden min-h-[400px]">
        {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
                <Package className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">У вас пока нет заказов</p>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 text-primary hover:underline"
                >
                    Создать первый заказ
                </button>
            </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">№</th>
                <th className="px-6 py-4 font-medium">Название</th>
                <th className="px-6 py-4 font-medium">Статус</th>
                <th className="px-6 py-4 font-medium">Стоимость</th>
                <th className="px-6 py-4 font-medium">Дата</th>
                <th className="px-6 py-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((order) => {
                const statusConfig = STATUSES[order.status] || STATUSES.pending;
                
                return (
                  <tr key={order.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white">#{order.id}</td>
                    <td className="px-6 py-4 text-gray-300">
                        <div className="font-medium text-white">{order.title || "Без названия"}</div>
                        {/* <div className="text-xs text-gray-500 truncate max-w-[200px]">Description here...</div> */}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-opacity-20",
                        statusConfig.color,
                        statusConfig.bg,
                        `border-${statusConfig.color.split('-')[1]}-500`
                      )}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {order.price > 0 ? `${order.price.toLocaleString()} ₽` : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => setSelectedOrderId(order.id)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" 
                            title="Подробнее"
                        >
                           <Eye className="h-4 w-4" />
                        </button>
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
      
      <ClientOrderDetailsModal 
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
