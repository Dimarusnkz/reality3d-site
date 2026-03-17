"use client";

import { useMemo, useState } from "react";
import { upsertCashReconciliation } from "@/app/actions/finance";
import { Loader2 } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Account = { code: "online" | "office_cash" | "bank"; name: string };
type ReconciliationRow = {
  id: string;
  day: string;
  cutoffAt: string;
  accountCode: string;
  accountName: string;
  openingKopeks: number;
  expectedKopeks: number;
  actualKopeks: number | null;
  diffKopeks: number | null;
  status: string;
  note: string | null;
};

function formatRub(kopeks: number | null) {
  if (kopeks == null) return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(kopeks / 100);
}

export function ReconciliationsClient({ accounts, rows, today }: { accounts: Account[]; rows: ReconciliationRow[]; today: string }) {
  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.code, a.name])), [accounts]);
  const [accountCode, setAccountCode] = useState<Account["code"]>(accounts[0]?.code || "office_cash");
  const [day, setDay] = useState(today);
  const [actualRub, setActualRub] = useState("");
  const [note, setNote] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const snapshot = async (withActual: boolean) => {
    setIsBusy(true);
    try {
      const parsedActual = Number(actualRub.replace(",", "."));
      if (withActual && (!Number.isFinite(parsedActual) || parsedActual < 0)) {
        alert("Некорректный факт");
        return;
      }
      const actual = withActual ? parsedActual : null;
      const res = await upsertCashReconciliation(
        { accountCode, day, actualRub: actual, note: note || null },
        getCsrfToken()
      );
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold text-lg">Сверка</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Касса</label>
            <select
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">День (МСК)</label>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Факт, ₽</label>
            <input
              value={actualRub}
              onChange={(e) => setActualRub(e.target.value)}
              placeholder="например: 1200"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-medium text-gray-400 ml-1">Комментарий</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => snapshot(false)}
            disabled={isBusy}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-800 px-6 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Снять ожидание
          </button>
          <button
            onClick={() => snapshot(true)}
            disabled={isBusy}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Подтвердить факт
          </button>
          <div className="text-sm text-gray-500 flex items-center">
            {accountMap.get(accountCode) ? `Касса: ${accountMap.get(accountCode)}` : null}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">История (последние 200)</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">День</th>
              <th className="p-4 text-left font-medium">Касса</th>
              <th className="p-4 text-right font-medium">Ожидалось</th>
              <th className="p-4 text-right font-medium">Факт</th>
              <th className="p-4 text-right font-medium">Расхождение</th>
              <th className="p-4 text-left font-medium">Статус</th>
              <th className="p-4 text-left font-medium">Срез</th>
              <th className="p-4 text-left font-medium">Комментарий</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-white font-mono text-xs">{r.day}</td>
                <td className="p-4 text-white">{r.accountName}</td>
                <td className="p-4 text-right text-white font-semibold">{formatRub(r.expectedKopeks)}</td>
                <td className="p-4 text-right text-gray-200">{formatRub(r.actualKopeks)}</td>
                <td className="p-4 text-right">
                  <span className={r.diffKopeks != null && Math.abs(r.diffKopeks) > 10000 ? "text-red-300" : "text-gray-300"}>
                    {formatRub(r.diffKopeks)}
                  </span>
                </td>
                <td className="p-4 text-gray-300">{r.status}</td>
                <td className="p-4 text-gray-400 text-xs">{new Date(r.cutoffAt).toLocaleString("ru-RU")}</td>
                <td className="p-4 text-gray-400">{r.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет сверок</div> : null}
      </div>
    </div>
  );
}
