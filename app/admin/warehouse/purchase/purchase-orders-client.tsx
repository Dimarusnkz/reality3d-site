"use client";

import { useState, useMemo } from "react";
import { createPurchaseOrder } from "@/app/actions/warehouse-purchase";
import { Loader2, Plus, Search, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { formatRub } from "@/lib/shop/money";
import { Badge } from "@/components/ui/badge";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function PurchaseOrdersClient({ 
  initialOrders, 
  suppliers,
  products 
}: { 
  initialOrders: any[],
  suppliers: { id: number, name: string }[],
  products: { id: number, name: string, sku: string | null }[]
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New PO Form
  const [supplierId, setSupplierId] = useState("");
  const [orderNo, setOrderNo] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [items, setItems] = useState<{ productId: number | null, name: string, qty: number, price: number }[]>([]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const s = searchTerm.toLowerCase();
    return orders.filter(o => 
      o.orderNo.toLowerCase().includes(s) || 
      o.supplier.name.toLowerCase().includes(s)
    );
  }, [orders, searchTerm]);

  const addItem = () => {
    setItems([...items, { productId: null, name: "", qty: 1, price: 0 }]);
  };

  const updateItem = (idx: number, data: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...data };
    setItems(next);
  };

  const handleProductSelect = (idx: number, prodId: string) => {
    const p = products.find(x => x.id === Number(prodId));
    if (p) {
      updateItem(idx, { productId: p.id, name: p.name });
    }
  };

  const save = async () => {
    if (!supplierId || items.length === 0) return;
    setIsSaving(true);
    try {
      const res = await createPurchaseOrder({
        supplierId: Number(supplierId),
        orderNo,
        items: items.map(i => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.qty,
          unit: "pcs",
          unitPriceRub: i.price
        }))
      }, getCsrfToken());

      if (res.ok) {
        window.location.reload();
      } else {
        alert(res.error || "Ошибка");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Закупки (Заказы поставщикам)</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          {isCreating ? "Отмена" : <><Plus className="w-4 h-4 mr-2" /> Создать заказ</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Поставщик</label>
              <select 
                value={supplierId} 
                onChange={e => setSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Выберите поставщика</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Номер заказа</label>
              <input 
                value={orderNo} 
                onChange={e => setOrderNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Товары в заказе</h3>
              <button onClick={addItem} className="text-primary hover:underline text-xs font-bold flex items-center gap-1">
                <Plus className="w-3 h-3" /> Добавить позицию
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase">Товар из каталога</label>
                    <select 
                      onChange={e => handleProductSelect(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                    >
                      <option value="">Выберите товар</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.sku ? `[${p.sku}] ` : ""}{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase">Кол-во</label>
                    <input 
                      type="number" 
                      value={it.qty} 
                      onChange={e => updateItem(idx, { qty: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase">Цена за ед.</label>
                    <input 
                      type="number" 
                      value={it.price} 
                      onChange={e => updateItem(idx, { price: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={save}
              disabled={isSaving || !supplierId || items.length === 0}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-10 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Создать документ закупки"}
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          placeholder="Поиск по номеру или поставщику..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-gray-400 border-b border-slate-800">
            <tr>
              <th className="p-6 font-bold uppercase tracking-wider text-[10px]">Заказ</th>
              <th className="p-6 font-bold uppercase tracking-wider text-[10px]">Поставщик</th>
              <th className="p-6 font-bold uppercase tracking-wider text-[10px]">Сумма</th>
              <th className="p-6 font-bold uppercase tracking-wider text-[10px]">Статус</th>
              <th className="p-6 font-bold uppercase tracking-wider text-[10px] text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredOrders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="p-6">
                  <div className="text-white font-bold">{o.orderNo}</div>
                  <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleDateString("ru-RU")}
                  </div>
                </td>
                <td className="p-6">
                  <div className="text-gray-300 font-medium">{o.supplier.name}</div>
                </td>
                <td className="p-6">
                  <div className="text-white font-bold">{formatRub(o.totalKopeks)}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{o._count.items} позиций</div>
                </td>
                <td className="p-6">
                  <Badge variant={
                    o.status === "completed" ? "success" : 
                    o.status === "partially_received" ? "info" : "warning"
                  }>
                    {o.status === "completed" ? "Выполнен" : 
                     o.status === "partially_received" ? "Частично получен" : "Ожидает"}
                  </Badge>
                </td>
                <td className="p-6 text-right">
                  <button className="text-primary hover:underline font-bold text-xs">
                    Подробности
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
            Заказы не найдены
          </div>
        )}
      </div>
    </div>
  );
}
