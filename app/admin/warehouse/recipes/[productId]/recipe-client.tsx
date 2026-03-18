"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { saveWarehouseRecipe } from "@/app/actions/warehouse-advanced";
import { Loader2, Plus, Trash2, Save } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type ProductOption = { id: number; name: string; sku: string | null; itemType: string };
type Row = { materialProductId: string; quantity: string; unit: string };

export function RecipeClient({
  product,
  materials,
  initial,
}: {
  product: { id: number; name: string; sku: string | null; itemType: string };
  materials: ProductOption[];
  initial: { isActive: boolean; items: { materialProductId: number; quantity: string; unit: string }[] } | null;
}) {
  const options = useMemo(() => materials.slice().sort((a, b) => a.name.localeCompare(b.name)), [materials]);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [rows, setRows] = useState<Row[]>(
    initial?.items?.length
      ? initial.items.map((i) => ({ materialProductId: String(i.materialProductId), quantity: i.quantity, unit: i.unit }))
      : [{ materialProductId: "", quantity: "1", unit: "pcs" }]
  );
  const [isBusy, setIsBusy] = useState(false);

  const addRow = () => setRows((prev) => [...prev, { materialProductId: "", quantity: "1", unit: "pcs" }]);
  const delRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const patch = (idx: number, update: Partial<Row>) => setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...update } : r)));

  const save = async () => {
    setIsBusy(true);
    try {
      const payload = {
        productId: product.id,
        isActive,
        items: rows
          .filter((r) => r.materialProductId)
          .map((r) => ({
            materialProductId: Number(r.materialProductId),
            quantity: r.quantity,
            unit: r.unit,
          })),
      };
      const res = await saveWarehouseRecipe(payload, getCsrfToken());
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
            <div className="text-white font-semibold text-lg">Рецептура</div>
            <div className="text-gray-400 text-sm mt-1">
              {product.name} <span className="text-gray-500">({product.itemType})</span>
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">{product.sku || "—"}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/warehouse/recipes" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
              Назад
            </Link>
            <button
              onClick={save}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Сохранить
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Статус</label>
            <select value={isActive ? "active" : "off"} onChange={(e) => setIsActive(e.target.value === "active")} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              <option value="active">Активна</option>
              <option value="off">Выключена</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-white font-semibold">Состав (на 1 шт.)</div>
          <button onClick={addRow} className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
              <tr>
                <th className="p-4 text-left font-medium">Материал</th>
                <th className="p-4 text-right font-medium">Кол-во</th>
                <th className="p-4 text-left font-medium">Ед.</th>
                <th className="p-4 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4">
                    <select
                      value={r.materialProductId}
                      onChange={(e) => patch(idx, { materialProductId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">—</option>
                      {options.slice(0, 1200).map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                          {p.sku ? ` (${p.sku})` : ""}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <input
                      value={r.quantity}
                      onChange={(e) => patch(idx, { quantity: e.target.value })}
                      className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-right"
                    />
                  </td>
                  <td className="p-4">
                    <select value={r.unit} onChange={(e) => patch(idx, { unit: e.target.value })} className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white">
                      <option value="pcs">шт</option>
                      <option value="kg">кг</option>
                      <option value="m">м</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => delRow(idx)} className="inline-flex p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет позиций</div> : null}
        </div>
      </div>
    </div>
  );
}

