"use client";

import { useMemo, useState } from "react";
import { createWarehouseMovement, updateInventorySettings } from "@/app/actions/warehouse";
import { Loader2 } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Product = { id: number; name: string; sku: string | null; stock: number };
type Inventory = { productId: number; unit: string; quantity: string; reserved: string; minThreshold: string };

export function WarehouseClient({
  products,
  inventory,
}: {
  products: Product[];
  inventory: Inventory[];
}) {
  const inventoryMap = useMemo(() => new Map(inventory.map((i) => [i.productId, i])), [inventory]);
  const [productId, setProductId] = useState<number>(products[0]?.id || 0);
  const [unit, setUnit] = useState<"pcs" | "m" | "kg">("pcs");
  const [quantity, setQuantity] = useState("1");
  const [actionType, setActionType] = useState<"receipt" | "writeoff" | "transfer_to_work">("receipt");
  const [reason, setReason] = useState<"sale" | "defect" | "internal" | "to_work">("sale");
  const [supplier, setSupplier] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [comment, setComment] = useState("");
  const [shopOrderId, setShopOrderId] = useState("");
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [minThreshold, setMinThreshold] = useState("0");
  const [isBusy, setIsBusy] = useState(false);

  const selectedInventory = inventoryMap.get(productId);

  const submitMovement = async () => {
    setIsBusy(true);
    try {
      const res = await createWarehouseMovement(
        {
          productId,
          unit,
          quantity,
          actionType,
          reason: actionType === "receipt" ? null : reason,
          supplier: actionType === "receipt" ? supplier : null,
          documentNo: actionType === "receipt" ? documentNo : null,
          comment: comment || null,
          shopOrderId: shopOrderId || null,
          serviceOrderId: serviceOrderId ? Number(serviceOrderId) : null,
        },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const saveSettings = async () => {
    setIsBusy(true);
    try {
      const res = await updateInventorySettings({ productId, unit, minThreshold }, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="text-white font-semibold text-lg">Операция</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Товар</label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku ? `${p.sku} — ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Тип</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="receipt">Приход</option>
              <option value="writeoff">Списание</option>
              <option value="transfer_to_work">В работу</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Количество</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="например: 10 или 2.5"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Единица</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="pcs">шт.</option>
              <option value="m">м</option>
              <option value="kg">кг</option>
            </select>
          </div>

          {actionType !== "receipt" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Причина</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="sale">Продажа</option>
                <option value="defect">Брак</option>
                <option value="internal">Внутреннее</option>
                <option value="to_work">В работу</option>
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Поставщик</label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Документ</label>
            <input
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">ShopOrderId (опц.)</label>
              <input
                value={shopOrderId}
                onChange={(e) => setShopOrderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">OrderId (опц.)</label>
              <input
                value={serviceOrderId}
                onChange={(e) => setServiceOrderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Комментарий</label>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          onClick={submitMovement}
          disabled={isBusy}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Провести
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold text-lg">Настройки товара</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="text-sm text-gray-400">
            Остаток:{" "}
            <span className="text-white font-semibold">
              {selectedInventory ? `${selectedInventory.quantity} ${selectedInventory.unit}` : "—"}
            </span>
            {selectedInventory ? (
              <span className="text-gray-500">
                {" "}
                / резерв {selectedInventory.reserved} {selectedInventory.unit} / свободно{" "}
                {String(Math.max(0, Number(selectedInventory.quantity) - Number(selectedInventory.reserved)))} {selectedInventory.unit}
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Мин. порог</label>
            <input
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button
            onClick={saveSettings}
            disabled={isBusy}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-6 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
