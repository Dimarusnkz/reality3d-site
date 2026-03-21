export function getClientLogActionLabel(actionType: string | null | undefined) {
  const a = String(actionType || "").toLowerCase();
  if (a === "cart_add") return "Добавление в корзину";
  if (a === "cart_update") return "Изменение корзины";
  if (a === "checkout_create") return "Оформление заказа";
  if (a === "payment_init") return "Инициализация оплаты";
  return actionType ? String(actionType) : "—";
}

export function getWarehouseLogActionLabel(actionType: string | null | undefined) {
  const a = String(actionType || "").toLowerCase();
  if (a === "reserve") return "Резерв";
  if (a === "unreserve") return "Снятие резерва";
  if (a === "writeoff") return "Списание";
  if (a === "threshold_update") return "Порог остатка";
  if (a === "transfer_out") return "Перемещение (отправка)";
  if (a === "transfer_in") return "Перемещение (приём)";
  if (a === "receipt_draft") return "Приход (черновик)";
  if (a === "receipt") return "Приход";
  if (a === "production_consume") return "Производство: расход";
  if (a === "production_output") return "Производство: выпуск";
  if (a === "inventory_adjust") return "Инвентаризация";
  return actionType ? String(actionType) : "—";
}

export function getAuditActionLabel(action: string | null | undefined) {
  const a = String(action || "");
  if (!a) return "—";
  if (a.startsWith("orders.")) return "Заказы: действие сотрудника";
  if (a.startsWith("finance.")) return "Касса: операция";
  if (a.startsWith("shop.")) return "Магазин: действие";
  if (a.startsWith("access.")) return "Роли/доступ: изменение";
  if (a.startsWith("roles.")) return "Роли/доступ: изменение";
  if (a.startsWith("sessions.")) return "Сессии: действие";
  if (a.startsWith("security.")) return "Безопасность: событие";
  if (a.startsWith("max.")) return "MAX: событие";
  if (a.startsWith("telegram.")) return "Telegram: событие";
  return a;
}
