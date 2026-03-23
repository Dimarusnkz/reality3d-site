"use client";

import { Clock, ArrowLeft, AlertCircle, CheckCircle2, Download } from "lucide-react";
import Link from "next/link";
import { formatRub } from "@/lib/shop/money";
import { Badge } from "@/components/ui/badge";

export function PurchaseOrderDetailsClient({ 
  order, 
  discrepancy 
}: { 
  order: any, 
  discrepancy: any[] 
}) {
  const exportCsv = () => {
    const headers = ["Товар", "Артикул", "Заказано", "Получено", "Разница"];
    const rows = discrepancy.map(d => [
      d.productName,
      d.sku || "",
      d.ordered.toString(),
      d.received.toString(),
      d.diff.toString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `discrepancy-${order.orderNo}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/warehouse/purchase" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Заказ {order.orderNo}</h1>
            <div className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-widest">{order.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={
            order.status === "completed" ? "success" : 
            order.status === "partially_received" ? "info" : "warning"
          }>
            {order.status === "completed" ? "Выполнен" : 
             order.status === "partially_received" ? "Частично получен" : "Ожидает"}
          </Badge>
          <button
            onClick={exportCsv}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-800 px-4 text-sm font-bold text-white hover:bg-slate-700 transition-all"
          >
            <Download className="w-4 h-4 mr-2" /> Акт расхождений (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items / Discrepancy Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-xs font-bold uppercase tracking-widest">
              Сверка товаров (Заказано vs Получено)
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950 text-gray-500 border-b border-slate-800">
                <tr>
                  <th className="p-4 font-medium">Товар</th>
                  <th className="p-4 font-medium text-center">Заказано</th>
                  <th className="p-4 font-medium text-center">Получено</th>
                  <th className="p-4 font-medium text-right">Разница</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {discrepancy.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="p-4">
                      <div className="text-white font-bold">{d.productName}</div>
                      {d.sku && <div className="text-[10px] text-gray-500 mt-0.5">SKU: {d.sku}</div>}
                    </td>
                    <td className="p-4 text-center text-gray-300 font-mono">{d.ordered}</td>
                    <td className="p-4 text-center text-gray-300 font-mono">{d.received}</td>
                    <td className="p-4 text-right font-mono">
                      {d.diff === 0 ? (
                        <span className="text-green-500 font-bold">ОК</span>
                      ) : d.diff < 0 ? (
                        <span className="text-red-500 font-bold">{d.diff}</span>
                      ) : (
                        <span className="text-blue-500 font-bold">+{d.diff}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Related Receipts */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-xs font-bold uppercase tracking-widest">
              Связанные приходы (Накладные)
            </div>
            {order.receipts.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {order.receipts.map((r: any) => (
                  <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{r.documentNo}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(r.receivedAt).toLocaleDateString("ru-RU")} • {r.postedBy?.name || "Система"}
                        </div>
                      </div>
                    </div>
                    <Link 
                      href={`/admin/warehouse/receipts/${r.id}?w=${order.warehouseId || 1}`}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Открыть
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                Приходов пока не было
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Supplier & Summary Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Поставщик</label>
              <div className="text-lg font-bold text-white">{order.supplier.name}</div>
              <div className="text-xs text-gray-400">{order.supplier.contact}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Общая сумма</label>
              <div className="text-2xl font-black text-primary">{formatRub(order.totalKopeks)}</div>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Создан: {new Date(order.createdAt).toLocaleString("ru-RU")}</span>
              </div>
            </div>
          </div>

          {order.comment && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-orange-500 uppercase tracking-widest">Комментарий</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{order.comment}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
