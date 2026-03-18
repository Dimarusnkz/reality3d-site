"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createWarehouseProductionOrder } from "@/app/actions/warehouse-advanced";
import { Loader2, Plus } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type ProductOption = { id: number; name: string; sku: string | null; itemType: string };
type Row = { id: string; createdAt: string; status: string; productName: string; qty: string; };

export function ProductionClient({ products, rows }: { products: ProductOption[]; rows: Row[] }) {
  const options = useMemo(() => products.slice().sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [comment, setComment] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const create = async () => {
    setIsBusy(true);
    try {
      const res = await createWarehouseProductionOrder({ productId: Number(productId), quantity, unit: "pcs", comment: comment || null }, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.href = `/admin/warehouse/production/${res.id}`;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold">Новое производство</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Товар</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              <option value="">—</option>
              {options
                .filter((p) => p.itemType === "product")
                .slice(0, 1200)
                .map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                    {p.sku ? ` (${p.sku})` : ""}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Кол-во (шт)</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="flex items-end">
            <button
              onClick={create}
              disabled={isBusy || !productId}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </button>
          </div>
          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-medium text-gray-400 ml-1">Комментарий</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
        </div>
        <div className="text-xs text-gray-500">При проведении будут списаны материалы по активной рецептуре.</div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Производства (последние 200)</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Дата</th>
              <th className="p-4 text-left font-medium">Товар</th>
              <th className="p-4 text-right font-medium">Кол-во</th>
              <th className="p-4 text-left font-medium">Статус</th>
              <th className="p-4 text-right font-medium">Открыть</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300">{new Date(r.createdAt).toLocaleString("ru-RU")}</td>
                <td className="p-4 text-white font-medium">{r.productName}</td>
                <td className="p-4 text-right text-gray-200">{r.qty}</td>
                <td className="p-4 text-gray-300">{r.status}</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/warehouse/production/${r.id}`} className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors">
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет производств</div> : null}
      </div>
    </div>
  );
}

