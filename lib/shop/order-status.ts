import { cn } from "@/lib/utils";

export function getShopOrderStatusMeta(status: string | null | undefined) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return { label: "Оплачен", className: cn("text-green-400 bg-green-500/10 border border-green-500/20") };
  if (s === "shipped") return { label: "Отправлен", className: cn("text-indigo-400 bg-indigo-500/10 border border-indigo-500/20") };
  if (s === "completed") return { label: "Завершён", className: cn("text-slate-300 bg-slate-500/10 border border-slate-500/20") };
  if (s === "cancelled") return { label: "Отменён", className: cn("text-red-400 bg-red-500/10 border border-red-500/20") };
  if (s === "pending") return { label: "В обработке", className: cn("text-yellow-400 bg-yellow-500/10 border border-yellow-500/20") };
  return { label: status ? String(status) : "—", className: cn("text-gray-300 bg-slate-500/10 border border-slate-500/20") };
}

export function getShopPaymentStatusMeta(status: string | null | undefined) {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return { label: "Оплачено", className: cn("text-green-400 bg-green-500/10 border border-green-500/20") };
  if (s === "unpaid") return { label: "Ждёт оплаты", className: cn("text-orange-400 bg-orange-500/10 border border-orange-500/20") };
  if (s === "failed") return { label: "Ошибка оплаты", className: cn("text-red-400 bg-red-500/10 border border-red-500/20") };
  return { label: status ? String(status) : "—", className: cn("text-gray-300 bg-slate-500/10 border border-slate-500/20") };
}

export function getShopPaymentProviderLabel(provider: string | null | undefined) {
  const p = String(provider || "").toLowerCase();
  if (p === "tbank_link") return "Т‑Банк (перевод)";
  if (p === "tbank") return "Т‑Банк (эквайринг)";
  if (p === "yookassa") return "ЮKassa";
  if (p === "sber_online") return "Сбербанк Онлайн";
  if (p === "tinkoff_online") return "Тинькофф Онлайн";
  return provider ? String(provider) : "—";
}

export function getShopPaymentAttemptStatusMeta(status: string | null | undefined) {
  const s = String(status || "").toLowerCase();
  if (s === "succeeded") return { label: "Успешно", className: cn("text-green-400") };
  if (s === "failed") return { label: "Неуспешно", className: cn("text-red-400") };
  if (s === "pending") return { label: "Ожидание", className: cn("text-orange-400") };
  return { label: status ? String(status) : "—", className: cn("text-gray-400") };
}

