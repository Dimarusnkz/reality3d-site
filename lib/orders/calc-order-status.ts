import { cn } from "@/lib/utils";

export function getCalcOrderStatusMeta(status: string | null | undefined) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return { label: "На проверке", className: cn("text-yellow-400 bg-yellow-500/10 border border-yellow-500/20") };
  if (s === "processing") return { label: "В работе", className: cn("text-blue-400 bg-blue-500/10 border border-blue-500/20") };
  if (s === "payment_pending") return { label: "Ожидает оплаты", className: cn("text-orange-400 bg-orange-500/10 border border-orange-500/20") };
  if (s === "paid") return { label: "Оплачен", className: cn("text-green-400 bg-green-500/10 border border-green-500/20") };
  if (s === "in_production") return { label: "В производстве", className: cn("text-purple-400 bg-purple-500/10 border border-purple-500/20") };
  if (s === "ready") return { label: "Готов к выдаче", className: cn("text-teal-300 bg-teal-500/10 border border-teal-500/20") };
  if (s === "shipped") return { label: "Отправлен", className: cn("text-indigo-400 bg-indigo-500/10 border border-indigo-500/20") };
  if (s === "completed") return { label: "Завершён", className: cn("text-slate-300 bg-slate-500/10 border border-slate-500/20") };
  if (s === "cancelled") return { label: "Отменён", className: cn("text-red-400 bg-red-500/10 border border-red-500/20") };
  return { label: status ? String(status) : "—", className: cn("text-gray-300 bg-slate-500/10 border border-slate-500/20") };
}

