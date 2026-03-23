"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createWarehouseReceipt } from "@/app/actions/warehouse-docs";
import { Clock, Loader2, Plus, Search } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Supplier = { id: number; name: string };
type Location = { id: number; code: string; name: string };
type ReceiptRow = {
  id: string;
  status: string;
  receivedAt: string;
  documentNo: string;
  supplierName: string | null;
  itemsCount: number;
};

export function ReceiptsClient({
  suppliers,
  locations,
  purchaseOrders,
  warehouseId,
  rows,
}: {
  suppliers: Supplier[];
  locations: Location[];
  purchaseOrders: { id: string; orderNo: string; supplier: { name: string } }[];
  warehouseId: number;
  rows: ReceiptRow[];
}) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [purchaseOrderId, setPurchaseOrderId] = useState<string>("");
  const [documentNo, setDocumentNo] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const supplierOptions = useMemo(() => suppliers.slice().sort((a, b) => a.name.localeCompare(b.name)), [suppliers]);
  const locationOptions = useMemo(() => locations.slice().sort((a, b) => a.code.localeCompare(b.code)), [locations]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const s = searchTerm.toLowerCase();
    return rows.filter(r => 
      r.documentNo.toLowerCase().includes(s) ||
      (r.supplierName && r.supplierName.toLowerCase().includes(s)) ||
      r.id.toLowerCase().includes(s)
    );
  }, [rows, searchTerm]);

  const create = async () => {
    setIsBusy(true);
    try {
      const res = await createWarehouseReceipt(
        {
          warehouseId,
          locationId: locationId ? Number(locationId) : null,
          supplierId: supplierId ? Number(supplierId) : null,
          purchaseOrderId: purchaseOrderId || null,
          documentNo: documentNo.trim(),
        },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.href = `/admin/warehouse/receipts/${res.id}?w=${warehouseId}`;
    } finally {
      setIsBusy(false);
    }
  };

  const onPoSelect = (id: string) => {
    setPurchaseOrderId(id);
    const po = purchaseOrders.find(x => x.id === id);
    if (po) {
      const s = suppliers.find(x => x.name === po.supplier.name);
      if (s) setSupplierId(String(s.id));
      if (!documentNo) setDocumentNo(`К заказу ${po.orderNo}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold">Новый приход</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Заказ (необяз.)</label>
            <select
              value={purchaseOrderId}
              onChange={(e) => onPoSelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs"
            >
              <option value="">— Без заказа —</option>
              {purchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.orderNo} ({po.supplier.name})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Поставщик</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs"
            >
              <option value="">—</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Локация</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs"
            >
              <option value="">—</option>
              {locationOptions.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">№ Документа</label>
            <input
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              placeholder="Напр. ТОРГ-12 №123"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={create}
              disabled={isBusy || !documentNo.trim()}
              className="w-full inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {isBusy ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              Создать
            </button>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Создаётся черновик. После добавления позиций нажми «Провести» — остатки увеличатся, в логи запишется приход.
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="text-gray-400 text-sm font-medium">История приходов</div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Поиск по номеру или поставщику..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-gray-400 border-b border-slate-800">
              <tr>
                <th className="p-4 font-medium">Дата</th>
                <th className="p-4 font-medium">Документ</th>
                <th className="p-4 font-medium">Поставщик</th>
                <th className="p-4 font-medium">Позиций</th>
                <th className="p-4 font-medium">Статус</th>
                <th className="p-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-gray-300">{new Date(r.receivedAt).toLocaleDateString("ru-RU")}</td>
                  <td className="p-4 text-white font-medium">{r.documentNo}</td>
                  <td className="p-4 text-gray-300">{r.supplierName || "—"}</td>
                  <td className="p-4 text-gray-300">{r.itemsCount}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === "posted" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                      }`}
                    >
                      {r.status === "posted" ? "Проведён" : "Черновик"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/warehouse/receipts/${r.id}?w=${warehouseId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <div className="p-12 text-center text-gray-500 font-medium">
              {searchTerm ? "Приходы не найдены" : "Нет записей"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
