"use client";

import { useMemo, useState } from "react";
import { createCashEntry } from "@/app/actions/finance";
import { Loader2 } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Account = { code: "online" | "office_cash" | "bank"; name: string };
type Entry = {
  id: string;
  createdAt: string;
  accountCode: string;
  direction: string;
  entryType: string;
  amountKopeks: number;
  description: string | null;
};

function formatRub(kopeks: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(kopeks / 100);
}

export function FinanceClient({ accounts, entries }: { accounts: Account[]; entries: Entry[] }) {
  const [accountCode, setAccountCode] = useState<Account["code"]>("office_cash");
  const [direction, setDirection] = useState<"income" | "expense" | "transfer" | "correction">("income");
  const [entryType, setEntryType] = useState("manual_cash");
  const [amountRub, setAmountRub] = useState("100");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.code, a.name])), [accounts]);

  const submit = async () => {
    const amount = Number(amountRub.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Некорректная сумма");
      return;
    }
    setIsSaving(true);
    try {
      const res = await createCashEntry(
        { accountCode, direction, entryType, amountRub: amount, description: description || null },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold text-lg">Добавить операцию</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Касса</label>
            <select
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Тип</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="income">Приход</option>
              <option value="expense">Расход</option>
              <option value="transfer">Перевод</option>
              <option value="correction">Коррекция</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Код</label>
            <input
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Сумма, ₽</label>
            <input
              value={amountRub}
              onChange={(e) => setAmountRub(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-5">
            <label className="text-sm font-medium text-gray-400 ml-1">Комментарий</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        <button
          onClick={submit}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Создать
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Операции (последние 200)</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Время</th>
              <th className="p-4 text-left font-medium">Касса</th>
              <th className="p-4 text-left font-medium">Тип</th>
              <th className="p-4 text-left font-medium">Код</th>
              <th className="p-4 text-right font-medium">Сумма</th>
              <th className="p-4 text-left font-medium">Комментарий</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entries.map((e) => (
              <tr key={e.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300">{new Date(e.createdAt).toLocaleString("ru-RU")}</td>
                <td className="p-4 text-white">{accountMap.get(e.accountCode as any) || e.accountCode}</td>
                <td className="p-4 text-gray-300">{e.direction}</td>
                <td className="p-4 text-gray-300 font-mono text-xs">{e.entryType}</td>
                <td className="p-4 text-right text-white font-semibold">{formatRub(e.amountKopeks)}</td>
                <td className="p-4 text-gray-400">{e.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? <div className="p-8 text-center text-gray-500">Нет операций</div> : null}
      </div>
    </div>
  );
}

