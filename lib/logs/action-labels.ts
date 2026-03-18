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

