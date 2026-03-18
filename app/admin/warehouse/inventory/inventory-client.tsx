"use client";

import Link from "next/link";
import { useState } from "react";
import { createWarehouseInventoryCount } from "@/app/actions/warehouse-advanced";
import { Loader2, Plus } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Row = { id: string; startedAt: string; status: string; itemsCount: number };

export function InventoryClient({ rows }: { rows: Row[] }) {
  const [comment, setComment] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const create = async () => {
    setIsBusy(true);
    try {
      const res = await createWarehouseInventoryCount({ comment: comment || null }, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.href = `/admin/warehouse/inventory/${res.id}`;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold">Новая инвентаризация</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Комментарий</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div>
            <button
              onClick={create}
              disabled={isBusy}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">Внеси фактические остатки и проведи — система создаст корректировки.</div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Инвентаризации</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Дата</th>
              <th className="p-4 text-left font-medium">Статус</th>
              <th className="p-4 text-left font-medium">Позиций</th>
              <th className="p-4 text-right font-medium">Открыть</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300">{new Date(r.startedAt).toLocaleString("ru-RU")}</td>
                <td className="p-4 text-gray-300">{r.status}</td>
                <td className="p-4 text-gray-300">{r.itemsCount}</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/warehouse/inventory/${r.id}`} className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors">
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет инвентаризаций</div> : null}
      </div>
    </div>
  );
}

