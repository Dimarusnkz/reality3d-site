"use client";

import { Search, Filter, RotateCcw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = 'draft' | 'calculating' | 'payment_pending' | 'paid' | 'in_production' | 'ready' | 'completed';

const STATUSES: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Черновик', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  calculating: { label: 'На расчете', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  payment_pending: { label: 'Ожидает оплаты', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  paid: { label: 'Оплачен', color: 'text-green-400', bg: 'bg-green-500/10' },
  in_production: { label: 'В производстве', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ready: { label: 'Готов к выдаче', color: 'text-secondary', bg: 'bg-secondary/10' },
  completed: { label: 'Завершен', color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

const MOCK_ORDERS = [
  { id: 124, status: 'in_production', price: 4500, date: '28.01.2026', items: 'Корпус для RPi (x2)' },
  { id: 123, status: 'ready', price: 1200, date: '25.01.2026', items: 'Шестерня (x10)' },
  { id: 122, status: 'completed', price: 8500, date: '20.01.2026', items: 'Прототип механизма' },
  { id: 121, status: 'payment_pending', price: 3200, date: '29.01.2026', items: 'Держатель (x5)' },
  { id: 120, status: 'calculating', price: 0, date: '29.01.2026', items: 'Фигурка героя' },
];

export default function LkOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Мои заказы</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Поиск по номеру..." 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors">
             <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="neon-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">№</th>
                <th className="px-6 py-4 font-medium">Состав заказа</th>
                <th className="px-6 py-4 font-medium">Статус</th>
                <th className="px-6 py-4 font-medium">Стоимость</th>
                <th className="px-6 py-4 font-medium">Дата</th>
                <th className="px-6 py-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {MOCK_ORDERS.map((order) => {
                const statusConfig = STATUSES[order.status as OrderStatus] || STATUSES.draft;
                
                return (
                  <tr key={order.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-white">#{order.id}</td>
                    <td className="px-6 py-4 text-gray-300">{order.items}</td>
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
                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Подробнее">
                           <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors" title="Повторить заказ">
                           <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
