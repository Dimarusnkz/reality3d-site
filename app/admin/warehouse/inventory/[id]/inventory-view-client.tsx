"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { postWarehouseInventoryCount, setWarehouseInventoryCountItem } from "@/app/actions/warehouse-advanced";
import { Loader2, CheckCircle, Plus, Save } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type ProductOption = { id: number; name: string; sku: string | null; itemType: string };
type ItemRow = { productId: number; name: string; sku: string | null; expectedQty: string; countedQty: string; delta: string; unit: string };

export function InventoryViewClient({
  inv,
  products,
  warehouseId,
}: {
  inv: { id: string; status: string; startedAt: string; comment: string | null; items: ItemRow[] };
  products: ProductOption[];
  warehouseId: number;
}) {
  const options = useMemo(() => products.slice().sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const [isBusy, setIsBusy] = useState(false);
  const isDraft = inv.status === "draft";

  const [productId, setProductId] = useState("");
  const [countedQty, setCountedQty] = useState("0");

  const addOrUpdate = async () => {
    setIsBusy(true);
    try {
      const res = await setWarehouseInventoryCountItem({ inventoryId: inv.id, productId: Number(productId), countedQty }, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const post = async () => {
    if (!confirm("Провести инвентаризацию? Будут созданы корректировки остатков.")) return;
    setIsBusy(true);
    try {
      const res = await postWarehouseInventoryCount(inv.id, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold text-lg">Инвентаризация</div>
            <div className="text-xs text-gray-500 font-mono mt-1">{inv.id}</div>
            <div className="text-sm text-gray-400 mt-2">Статус: {inv.status}</div>
            <div className="text-xs text-gray-500 mt-1">{new Date(inv.startedAt).toLocaleString("ru-RU")}</div>
            {inv.comment ? <div className="text-sm text-gray-300 mt-3">{inv.comment}</div> : null}
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/warehouse/inventory?w=${warehouseId}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
              Назад
            </Link>
            {isDraft ? (
              <button onClick={post} disabled={isBusy} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Провести
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {isDraft ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="text-white font-semibold">Добавить / обновить позицию</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Товар</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                <option value="">—</option>
                {options.slice(0, 1500).map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                    {p.sku ? ` (${p.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Факт</label>
              <input value={countedQty} onChange={(e) => setCountedQty(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
            <div>
              <button
                onClick={addOrUpdate}
                disabled={isBusy || !productId}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-6 text-sm font-semibold disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Применить
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Позиции</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Товар</th>
              <th className="p-4 text-right font-medium">Ожид.</th>
              <th className="p-4 text-right font-medium">Факт</th>
              <th className="p-4 text-right font-medium">Δ</th>
              <th className="p-4 text-left font-medium">Ед.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {inv.items.map((i) => (
              <tr key={i.productId} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="text-white font-medium">{i.name}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{i.sku || "—"}</div>
                </td>
                <td className="p-4 text-right text-gray-200">{i.expectedQty}</td>
                <td className="p-4 text-right text-white font-semibold">{i.countedQty}</td>
                <td className="p-4 text-right text-gray-200">{i.delta}</td>
                <td className="p-4 text-gray-300">{i.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {inv.items.length === 0 ? <div className="p-8 text-center text-gray-500">Нет позиций</div> : null}
      </div>
    </div>
  );
}
