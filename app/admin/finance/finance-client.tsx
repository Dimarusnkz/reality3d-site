"use client";

import { useMemo, useState } from "react";
import { createCashEntry } from "@/app/actions/finance";
import { Loader2, Plus, Wallet, History, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCashDirectionMeta, getCashEntryTypeLabel } from "@/lib/finance/cash-entry-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8">
      {/* Form */}
      <div className="neon-card p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          Новая операция
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Касса / Счет</label>
            <select
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Тип транзакции</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
            >
              <option value="income">Приход (+)</option>
              <option value="expense">Расход (-)</option>
              <option value="transfer">Перевод (⇄)</option>
              <option value="correction">Коррекция (±)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Системный код</label>
            <input
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all font-mono text-sm"
              placeholder="manual_cash"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Сумма, ₽</label>
            <div className="relative">
              <input
                value={amountRub}
                onChange={(e) => setAmountRub(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all text-lg font-black tracking-tighter"
                placeholder="0.00"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">₽</div>
            </div>
          </div>
          <div className="space-y-2 md:col-span-4 lg:col-span-5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Комментарий / Назначение платежа</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all text-sm"
              placeholder="Введите описание операции..."
            />
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-end">
          <Button
            onClick={submit}
            disabled={isSaving}
            className="h-12 px-10 font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
            Записать операцию
          </Button>
        </div>
      </div>

      {/* History Table */}
      <div className="neon-card rounded-3xl border border-slate-800/50 overflow-hidden bg-slate-900/20">
        <div className="p-6 bg-slate-950/40 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-tight">
            <History className="w-5 h-5 text-gray-500" />
            История операций
          </h3>
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest px-3">
            Последние 200
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 bg-slate-950/20 border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Дата и время</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Касса</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Тип</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Код</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Сумма</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Комментарий</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {entries.map((e) => {
                const directionMeta = getCashDirectionMeta(e.direction);
                return (
                  <tr key={e.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="text-white font-bold">{new Date(e.createdAt).toLocaleDateString("ru-RU")}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{new Date(e.createdAt).toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="secondary" className="bg-slate-800 text-gray-300 border-slate-700">
                        {accountMap.get(e.accountCode as any) || e.accountCode}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={
                        e.direction === 'income' ? 'success' : 
                        e.direction === 'expense' ? 'error' : 
                        e.direction === 'transfer' ? 'info' : 'warning'
                      }>
                        {directionMeta.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-gray-200 font-bold text-xs">{getCashEntryTypeLabel(e.entryType)}</div>
                      <div className="text-[10px] text-gray-600 font-mono mt-0.5 uppercase">{e.entryType}</div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className={cn(
                        "text-lg font-black tracking-tight",
                        e.direction === 'income' ? 'text-green-400' : 
                        e.direction === 'expense' ? 'text-red-400' : 'text-white'
                      )}>
                        {e.direction === 'expense' ? '-' : e.direction === 'income' ? '+' : ''}{formatRub(e.amountKopeks)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-gray-500 text-xs italic line-clamp-2 max-w-[240px] leading-relaxed">
                        {e.description || "—"}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {entries.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
              <Search className="w-8 h-8 text-gray-700" />
            </div>
            <p className="text-gray-500 font-medium text-lg">Операций пока нет</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
