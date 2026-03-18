"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addWarehouseTransferItem, deleteWarehouseTransferItem, postWarehouseTransfer } from "@/app/actions/warehouse-transfers";
import { Loader2, Plus, Trash2, CheckCircle } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type ProductOption = { id: number; name: string; sku: string | null; itemType: string };
type Item = { id: string; productId: number; sku: string | null; productName: string; quantity: string; unit: string };

export function TransferClient({
  warehouseId,
  transfer,
  products,
}: {
  warehouseId: number;
  transfer: {
    id: string;
    status: string;
    createdAt: string;
    fromLabel: string;
    toLabel: string;
    comment: string | null;
    items: Item[];
  };
  products: ProductOption[];
}) {
  const options = useMemo(() => products.slice().sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const [isBusy, setIsBusy] = useState(false);
  const isDraft = transfer.status === "draft";

  const [form, setForm] = useState({ productId: "", quantity: "1", unit: "pcs" });

  const add = async () => {
    setIsBusy(true);
    try {
      const res = await addWarehouseTransferItem(
        { transferId: transfer.id, productId: Number(form.productId), quantity: form.quantity, unit: form.unit },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Удалить позицию?")) return;
    setIsBusy(true);
    try {
      const res = await deleteWarehouseTransferItem(id, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const post = async () => {
    if (!confirm("Провести перемещение? Отменить будет нельзя.")) return;
    setIsBusy(true);
    try {
      const res = await postWarehouseTransfer(transfer.id, getCsrfToken());
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold text-lg">Перемещение</div>
            <div className="text-xs text-gray-500 font-mono mt-1">{transfer.id}</div>
            <div className="text-sm text-gray-400 mt-2">
              {transfer.fromLabel} → {transfer.toLabel}
            </div>
            <div className="text-xs text-gray-500 mt-1">{new Date(transfer.createdAt).toLocaleString("ru-RU")}</div>
            {transfer.comment ? <div className="text-sm text-gray-300 mt-2">{transfer.comment}</div> : null}
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/warehouse/transfers?w=${warehouseId}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
              Назад
            </Link>
            {isDraft ? (
              <button onClick={post} disabled={isBusy} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Провести
              </button>
            ) : (
              <div className="text-sm text-gray-400">Статус: {transfer.status}</div>
            )}
          </div>
        </div>
      </div>

      {isDraft ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="text-white font-semibold">Добавить позицию</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Товар</label>
              <select value={form.productId} onChange={(e) => setForm((p) => ({ ...p, productId: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
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
              <label className="text-sm font-medium text-gray-400 ml-1">Кол-во</label>
              <input value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Ед.</label>
              <select value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
                <option value="pcs">шт</option>
                <option value="kg">кг</option>
                <option value="m">м</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <button onClick={add} disabled={isBusy || !form.productId} className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-5 text-sm font-semibold disabled:opacity-50">
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Добавить
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
              <th className="p-4 text-right font-medium">Кол-во</th>
              <th className="p-4 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {transfer.items.map((i) => (
              <tr key={i.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <div className="text-white font-medium">{i.productName}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{i.sku || "—"}</div>
                </td>
                <td className="p-4 text-right text-gray-200">
                  {i.quantity} {i.unit}
                </td>
                <td className="p-4 text-right">
                  {isDraft ? (
                    <button onClick={() => del(i.id)} disabled={isBusy} className="inline-flex p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transfer.items.length === 0 ? <div className="p-8 text-center text-gray-500">Нет позиций</div> : null}
      </div>
    </div>
  );
}

