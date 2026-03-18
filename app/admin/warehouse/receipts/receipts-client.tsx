"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createWarehouseReceipt } from "@/app/actions/warehouse-docs";
import { Loader2, Plus } from "lucide-react";

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
  warehouseId,
  rows,
}: {
  suppliers: Supplier[];
  locations: Location[];
  warehouseId: number;
  rows: ReceiptRow[];
}) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [documentNo, setDocumentNo] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const supplierOptions = useMemo(() => suppliers.slice().sort((a, b) => a.name.localeCompare(b.name)), [suppliers]);
  const locationOptions = useMemo(() => locations.slice().sort((a, b) => a.code.localeCompare(b.code)), [locations]);

  const create = async () => {
    setIsBusy(true);
    try {
      const res = await createWarehouseReceipt(
        {
          warehouseId,
          locationId: locationId ? Number(locationId) : null,
          supplierId: supplierId ? Number(supplierId) : null,
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

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold">Новый приход</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Поставщик</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
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
            <label className="text-sm font-medium text-gray-400 ml-1">Номер накладной</label>
            <input
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={create}
              disabled={isBusy || documentNo.trim().length === 0}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Создаётся черновик. После добавления позиций нажми «Провести» — остатки увеличатся, себестоимость сохранится, в логи запишется приход.
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Приходы (последние 200)</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Дата</th>
              <th className="p-4 text-left font-medium">Накладная</th>
              <th className="p-4 text-left font-medium">Поставщик</th>
              <th className="p-4 text-left font-medium">Позиций</th>
              <th className="p-4 text-left font-medium">Статус</th>
              <th className="p-4 text-right font-medium">Открыть</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300">{new Date(r.receivedAt).toLocaleString("ru-RU")}</td>
                <td className="p-4 text-white font-mono text-xs">{r.documentNo}</td>
                <td className="p-4 text-gray-300">{r.supplierName || "—"}</td>
                <td className="p-4 text-gray-300">{r.itemsCount}</td>
                <td className="p-4 text-gray-300">{r.status}</td>
                <td className="p-4 text-right">
                  <Link
                    href={`/admin/warehouse/receipts/${r.id}?w=${warehouseId}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors"
                  >
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет приходов</div> : null}
      </div>
    </div>
  );
}
