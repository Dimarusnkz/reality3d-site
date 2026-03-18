import { cn } from "@/lib/utils";

export function getCashDirectionMeta(direction: string | null | undefined) {
  const d = String(direction || "").toLowerCase();
  if (d === "income") return { label: "Приход", className: cn("text-green-400 bg-green-500/10 border border-green-500/20") };
  if (d === "expense") return { label: "Расход", className: cn("text-red-400 bg-red-500/10 border border-red-500/20") };
  if (d === "transfer") return { label: "Перевод", className: cn("text-indigo-400 bg-indigo-500/10 border border-indigo-500/20") };
  if (d === "correction") return { label: "Коррекция", className: cn("text-yellow-400 bg-yellow-500/10 border border-yellow-500/20") };
  return { label: direction ? String(direction) : "—", className: cn("text-gray-300 bg-slate-500/10 border border-slate-500/20") };
}

export function getCashEntryTypeLabel(entryType: string | null | undefined) {
  const t = String(entryType || "").toLowerCase();
  if (t === "manual_cash") return "Ручная операция";
  if (t === "order_payment") return "Оплата заказа";
  if (t === "reconciliation") return "Сверка";
  if (t === "refund") return "Возврат";
  if (t === "salary") return "Зарплата";
  return entryType ? String(entryType) : "—";
}

