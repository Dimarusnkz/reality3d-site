"use client";

import { useState } from "react";
import { postWarehouseProductionOrder } from "@/app/actions/warehouse-advanced";
import { Loader2, CheckCircle } from "lucide-react";
import { formatRub } from "@/lib/shop/money";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function ProductionViewClient({
  prod,
}: {
  prod: {
    id: string;
    status: string;
    createdAt: string;
    postedAt: string | null;
    comment: string | null;
    productName: string;
    productSku: string | null;
    quantity: string;
    unit: string;
    consumes: { id: string; name: string; sku: string | null; quantity: string; unit: string; totalCostKopeks: number | null }[];
  };
}) {
  const [isBusy, setIsBusy] = useState(false);

  const post = async () => {
    if (!confirm("Провести производство? Материалы будут списаны, товар выпущен.")) return;
    setIsBusy(true);
    try {
      const res = await postWarehouseProductionOrder(prod.id, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const total = prod.consumes.reduce((sum, c) => sum + (c.totalCostKopeks || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-2">
        <div className="text-sm text-gray-400">Статус</div>
        <div className="text-white font-semibold">{prod.status}</div>
        <div className="text-xs text-gray-500 mt-2">Создано: {new Date(prod.createdAt).toLocaleString("ru-RU")}</div>
        {prod.postedAt ? <div className="text-xs text-gray-500">Проведено: {new Date(prod.postedAt).toLocaleString("ru-RU")}</div> : null}
        {prod.comment ? <div className="text-sm text-gray-300 mt-3">{prod.comment}</div> : null}

        {prod.status === "draft" ? (
          <button
            onClick={post}
            disabled={isBusy}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Провести
          </button>
        ) : null}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-white font-semibold">Списание материалов</div>
          <div className="text-sm text-gray-300">
            Себестоимость: <span className="text-white font-bold">{formatRub(total)}</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
              <tr>
                <th className="p-4 text-left font-medium">Материал</th>
                <th className="p-4 text-right font-medium">Кол-во</th>
                <th className="p-4 text-right font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {prod.consumes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{c.sku || "—"}</div>
                  </td>
                  <td className="p-4 text-right text-gray-200">
                    {c.quantity} {c.unit}
                  </td>
                  <td className="p-4 text-right text-white font-semibold">{c.totalCostKopeks == null ? "—" : formatRub(c.totalCostKopeks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {prod.consumes.length === 0 ? <div className="p-8 text-center text-gray-500">Нет данных</div> : null}
        </div>
      </div>
    </div>
  );
}

