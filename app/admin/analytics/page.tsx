"use client";

import React, { useEffect, useState } from "react";
import { getCogsReport, getInventoryTurnoverReport } from "@/app/actions/analytics";
import { Loader2, TrendingUp, Package, AlertTriangle, Calendar, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [cogsData, setCogsData] = useState<any>(null);
  const [turnoverData, setTurnoverData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });

  const fetchData = async () => {
    setLoading(true);
    const [cogs, turnover] = await Promise.all([
      getCogsReport(dateRange.start, dateRange.end),
      getInventoryTurnoverReport()
    ]);
    if (cogs.ok) setCogsData(cogs);
    if (turnover.ok) setTurnoverData(turnover.report);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange.start, dateRange.end]);

  const setRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setDateRange({ start, end });
  };

  const exportToCsv = () => {
    if (!cogsData?.items) return;
    const headers = ["ID", "Name", "Qty", "Revenue", "COGS", "Margin", "Margin%"];
    const rows = cogsData.items.map((i: any) => [
      i.id,
      i.name,
      i.qty,
      (i.revenue / 100).toFixed(2),
      (i.cogs / 100).toFixed(2),
      (i.margin / 100).toFixed(2),
      i.marginPercent.toFixed(2)
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRub = (kopeks: number) => (kopeks / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="animate-pulse font-medium">Сбор данных и расчет аналитики...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Аналитика и Отчеты
          </h1>
          <p className="text-gray-500 mt-1">Reality3D Business Intelligence</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
             {[
               { label: "7д", days: 7 },
               { label: "30д", days: 30 },
               { label: "90д", days: 90 },
               { label: "Год", days: 365 }
             ].map((btn) => (
               <button
                 key={btn.label}
                 onClick={() => setRange(btn.days)}
                 className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all text-gray-400 hover:text-white"
               >
                 {btn.label}
               </button>
             ))}
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
             <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-400 uppercase">
                <Calendar className="w-3.5 h-3.5" />
                {dateRange.start.toLocaleDateString()} — {dateRange.end.toLocaleDateString()}
             </div>
             <button onClick={exportToCsv} className="p-1.5 bg-slate-800 text-gray-400 rounded-lg hover:text-white transition-all" title="Export CSV">
                <Download className="w-3.5 h-3.5" />
             </button>
             <button onClick={fetchData} className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all">
                Обновить
             </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Выручка (за период)</div>
          <div className="text-3xl font-black text-white tracking-tight">{formatRub(cogsData?.totalRevenue || 0)}</div>
          <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             По оплаченным заказам
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Себестоимость (COGS)</div>
          <div className="text-3xl font-black text-white tracking-tight">{formatRub(cogsData?.totalCogs || 0)}</div>
          <div className="mt-4 text-gray-500 text-xs font-medium">
             Рассчитано по закупочным ценам
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <TrendingUp className="w-16 h-16 text-primary" />
          </div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Валовая прибыль / Маржа</div>
          <div className="text-3xl font-black text-primary tracking-tight">{formatRub(cogsData?.totalMargin || 0)}</div>
          <div className="mt-4 flex items-center gap-2">
             <span className="text-xs font-black bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                {cogsData?.marginPercent.toFixed(1)}%
             </span>
             <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tight">Эффективность</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products by Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Топ товаров по прибыли
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-950/50 text-gray-500 text-[9px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left">Товар</th>
                  <th className="px-4 py-3 text-right">Кол-во</th>
                  <th className="px-4 py-3 text-right">Прибыль</th>
                  <th className="px-4 py-3 text-right">Маржа</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {cogsData?.items.slice(0, 8).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium truncate max-w-[200px]">{item.name}</td>
                    <td className="px-4 py-3 text-right text-gray-400 font-mono">{item.qty}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{formatRub(item.margin)}</td>
                    <td className="px-4 py-3 text-right">
                       <span className="text-[10px] font-bold text-primary">{item.marginPercent.toFixed(0)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Risk Report */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Дефицит и Оборачиваемость
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-950/50 text-gray-500 text-[9px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left">Товар</th>
                  <th className="px-4 py-3 text-right">Остаток</th>
                  <th className="px-4 py-3 text-right">Продажи (30д)</th>
                  <th className="px-4 py-3 text-right">Хватит на</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {turnoverData?.filter((i: any) => i.daysOfStock < 15 || i.currentStock < 5).slice(0, 8).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                       <div className="text-white font-medium truncate max-w-[180px]">{item.name}</div>
                       <div className="text-[9px] text-gray-600 font-mono">{item.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <span className={cn(
                         "font-bold font-mono",
                         item.currentStock <= 0 ? "text-red-500" : item.currentStock < 5 ? "text-amber-500" : "text-gray-400"
                       )}>
                         {item.currentStock}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 font-mono">{item.soldLast30Days}</td>
                    <td className="px-4 py-3 text-right">
                       {item.daysOfStock <= 0 ? (
                         <span className="text-[9px] font-black text-red-500 uppercase">Нет в наличии</span>
                       ) : item.daysOfStock >= 999 ? (
                         <span className="text-[9px] font-black text-gray-600 uppercase">Без продаж</span>
                       ) : (
                         <span className={cn(
                           "text-[10px] font-bold px-2 py-0.5 rounded",
                           item.daysOfStock < 7 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                         )}>
                           {item.daysOfStock} дн.
                         </span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {turnoverData?.length === 0 && (
            <div className="p-8 text-center text-gray-600 text-[10px] font-black uppercase">Нет данных для анализа</div>
          )}
        </div>
      </div>
    </div>
  );
}
