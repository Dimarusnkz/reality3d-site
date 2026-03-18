"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createWarehouseTransfer } from "@/app/actions/warehouse-transfers";
import { Loader2, Plus } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Warehouse = { id: number; code: string; name: string };
type Location = { id: number; warehouseId: number; code: string; name: string };
type Row = { id: string; status: string; createdAt: string; from: string; to: string; itemsCount: number };

export function TransfersClient({
  warehouseId,
  warehouses,
  locations,
  rows,
}: {
  warehouseId: number;
  warehouses: Warehouse[];
  locations: Location[];
  rows: Row[];
}) {
  const whOptions = useMemo(() => warehouses.slice().sort((a, b) => a.name.localeCompare(b.name)), [warehouses]);
  const [fromWarehouseId, setFromWarehouseId] = useState(String(warehouseId));
  const [toWarehouseId, setToWarehouseId] = useState(String(warehouseId));
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [comment, setComment] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const locFrom = useMemo(() => locations.filter((l) => String(l.warehouseId) === fromWarehouseId).sort((a, b) => a.code.localeCompare(b.code)), [locations, fromWarehouseId]);
  const locTo = useMemo(() => locations.filter((l) => String(l.warehouseId) === toWarehouseId).sort((a, b) => a.code.localeCompare(b.code)), [locations, toWarehouseId]);

  const create = async () => {
    setIsBusy(true);
    try {
      const res = await createWarehouseTransfer(
        {
          fromWarehouseId: Number(fromWarehouseId),
          fromLocationId: fromLocationId ? Number(fromLocationId) : null,
          toWarehouseId: Number(toWarehouseId),
          toLocationId: toLocationId ? Number(toLocationId) : null,
          comment: comment || null,
        },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.href = `/admin/warehouse/transfers/${res.id}?w=${warehouseId}`;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold">Новое перемещение</div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Откуда (склад)</label>
            <select value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              {whOptions.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Откуда (локация)</label>
            <select value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              <option value="">—</option>
              {locFrom.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Куда (склад)</label>
            <select value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              {whOptions.map((w) => (
                <option key={w.id} value={String(w.id)}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Куда (локация)</label>
            <select value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              <option value="">—</option>
              {locTo.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-5">
            <label className="text-sm font-medium text-gray-400 ml-1">Комментарий</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="flex items-end">
            <button onClick={create} disabled={isBusy} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Перемещения (последние 200)</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Дата</th>
              <th className="p-4 text-left font-medium">Откуда</th>
              <th className="p-4 text-left font-medium">Куда</th>
              <th className="p-4 text-left font-medium">Позиций</th>
              <th className="p-4 text-left font-medium">Статус</th>
              <th className="p-4 text-right font-medium">Открыть</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300">{new Date(r.createdAt).toLocaleString("ru-RU")}</td>
                <td className="p-4 text-gray-300">{r.from}</td>
                <td className="p-4 text-gray-300">{r.to}</td>
                <td className="p-4 text-gray-300">{r.itemsCount}</td>
                <td className="p-4 text-gray-300">{r.status}</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/warehouse/transfers/${r.id}?w=${warehouseId}`} className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors">
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет перемещений</div> : null}
      </div>
    </div>
  );
}

