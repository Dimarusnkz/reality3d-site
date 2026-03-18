"use client";

import { useMemo, useState } from "react";
import { createWarehouse, updateWarehouse } from "@/app/actions/warehouse-advanced";
import { Loader2, Plus, Save } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Row = { id: number; code: string; name: string; isActive: boolean };

export function WarehousesClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [isBusy, setIsBusy] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const sorted = useMemo(() => rows.slice().sort((a, b) => a.id - b.id), [rows]);

  const create = async () => {
    setIsBusy(true);
    try {
      const res = await createWarehouse({ code, name, isActive: true }, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      setRows((prev) => [...prev, res.warehouse]);
      setCode("");
      setName("");
    } finally {
      setIsBusy(false);
    }
  };

  const patch = (id: number, update: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...update } : r)));
  };

  const save = async (r: Row) => {
    setIsBusy(true);
    try {
      const res = await updateWarehouse(r.id, { code: r.code, name: r.name, isActive: r.isActive }, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="text-white font-semibold mb-4">Добавить склад</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Код</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div>
            <button onClick={create} disabled={isBusy || code.trim().length === 0 || name.trim().length < 2} className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Склады</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">ID</th>
              <th className="p-4 text-left font-medium">Код</th>
              <th className="p-4 text-left font-medium">Название</th>
              <th className="p-4 text-left font-medium">Активен</th>
              <th className="p-4 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sorted.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300 font-mono">{r.id}</td>
                <td className="p-4">
                  <input value={r.code} onChange={(e) => patch(r.id, { code: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono" />
                </td>
                <td className="p-4">
                  <input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
                </td>
                <td className="p-4">
                  <select value={r.isActive ? "yes" : "no"} onChange={(e) => patch(r.id, { isActive: e.target.value === "yes" })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white">
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => save(r)} disabled={isBusy || r.code.trim().length === 0 || r.name.trim().length < 2} className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium disabled:opacity-50">
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Сохранить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 ? <div className="p-8 text-center text-gray-500">Нет складов</div> : null}
      </div>
    </div>
  );
}

