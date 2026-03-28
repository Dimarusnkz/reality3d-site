"use client";

import { useMemo, useState } from "react";
import { addWarehouseReceiptItem, deleteWarehouseReceiptItem, postWarehouseReceipt, updateWarehouseReceipt, unpostWarehouseReceipt, deleteWarehouseReceipt } from "@/app/actions/warehouse-docs";
import { Loader2, Plus, Trash2, CheckCircle, Upload, RotateCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatRub } from "@/lib/shop/money";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Supplier = { id: number; name: string };
type ProductOption = { id: number; name: string; sku: string | null };
type Location = { id: number; code: string; name: string };
type Item = {
  id: string;
  productId: number | null;
  sku: string | null;
  productName: string;
  quantity: string;
  unit: string;
  unitCostKopeks: number;
  totalCostKopeks: number;
};

export function ReceiptClient({
  receipt,
  suppliers,
  locations,
  products,
  userRole,
}: {
  receipt: {
    id: string;
    status: string;
    warehouseId: number;
    locationId: number | null;
    supplierId: number | null;
    documentNo: string;
    receivedAt: string;
    attachmentUrl: string | null;
    comment: string | null;
    supplierName: string | null;
    items: Item[];
  };
  suppliers: Supplier[];
  locations: Location[];
  products: ProductOption[];
  userRole?: string;
}) {
  const supplierOptions = useMemo(() => suppliers.slice().sort((a, b) => a.name.localeCompare(b.name)), [suppliers]);
  const locationOptions = useMemo(() => locations.slice().sort((a, b) => a.code.localeCompare(b.code)), [locations]);
  const productOptions = useMemo(() => products.slice().sort((a, b) => a.name.localeCompare(b.name)), [products]);

  const [header, setHeader] = useState({
    supplierId: receipt.supplierId ? String(receipt.supplierId) : "",
    locationId: receipt.locationId ? String(receipt.locationId) : "",
    documentNo: receipt.documentNo,
    receivedAt: receipt.receivedAt.slice(0, 10),
    attachmentUrl: receipt.attachmentUrl || "",
    comment: receipt.comment || "",
  });

  const [itemForm, setItemForm] = useState({
    productId: "",
    sku: "",
    productName: "",
    quantity: "1",
    unit: "pcs",
    unitCostRub: "",
  });

  const [isBusy, setIsBusy] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDraft = receipt.status === "draft";

  const saveHeader = async () => {
    setIsBusy(true);
    try {
      const res = await updateWarehouseReceipt(
        receipt.id,
        {
          warehouseId: receipt.warehouseId,
          locationId: header.locationId ? Number(header.locationId) : null,
          supplierId: header.supplierId ? Number(header.supplierId) : null,
          documentNo: header.documentNo,
          receivedAt: header.receivedAt,
          attachmentUrl: header.attachmentUrl || null,
          comment: header.comment || null,
        },
        getCsrfToken()
      );
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const deleteReceipt = async () => {
    const hasItems = receipt.items.length > 0;
    if (hasItems) {
      if (!confirm(`Удалить черновик прихода "${receipt.documentNo}"? Все позиции будут удалены.`)) return;
    }
    
    setIsDeleting(true);
    try {
      const res = await deleteWarehouseReceipt(receipt.id, getCsrfToken());
      if (!res.ok) alert(res.error);
      else window.location.href = `/admin/warehouse/receipts?w=${receipt.warehouseId}`;
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadFile = async (file: File) => {
    const csrf = getCsrfToken();
    const body = new FormData();
    body.set("file", file);
    body.set("csrf_token", csrf);

    const res = await fetch("/api/upload", {
      method: "POST",
      body,
      headers: { "x-csrf-token": csrf },
    });

    const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || !json?.url) throw new Error(json?.error || "Ошибка загрузки");
    return json.url;
  };

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsBusy(true);
    try {
      const url = await uploadFile(files[0]);
      setHeader((prev) => ({ ...prev, attachmentUrl: url }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setIsBusy(false);
    }
  };

  const addItem = async () => {
    setIsBusy(true);
    try {
      const unitCost = Number(String(itemForm.unitCostRub).replace(",", "."));
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        alert("Некорректная цена закупки");
        return;
      }

      const res = await addWarehouseReceiptItem(
        receipt.id,
        {
          productId: itemForm.productId ? Number(itemForm.productId) : null,
          sku: itemForm.sku || null,
          productName: itemForm.productName,
          quantity: itemForm.quantity,
          unit: itemForm.unit,
          unitCostRub: unitCost,
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

  const removeItem = async (id: string) => {
    if (!confirm("Удалить позицию?")) return;
    setIsBusy(true);
    try {
      const res = await deleteWarehouseReceiptItem(id, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const post = async () => {
    if (!confirm("Провести приход? Остатки на складе увеличатся.")) return;
    setIsBusy(true);
    try {
      const res = await postWarehouseReceipt(receipt.id, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const unpost = async () => {
    if (!confirm("Внимание! Распроведение прихода уменьшит остатки на складе. Если текущий остаток меньше, чем в документе, он станет отрицательным. Продолжить?")) return;
    setIsBusy(true);
    try {
      const res = await unpostWarehouseReceipt(receipt.id, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const totalKopeks = receipt.items.reduce((sum, i) => sum + i.totalCostKopeks, 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold text-lg">Приход</div>
            <div className="text-xs text-gray-500 font-mono mt-1">{receipt.id}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/admin/warehouse/receipts?w=${receipt.warehouseId}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
              Назад
            </Link>
            {userRole === "admin" && isDraft && (
              <button
                onClick={deleteReceipt}
                disabled={isDeleting || isBusy}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all disabled:opacity-50"
                title="Удалить черновик прихода"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
            {isDraft ? (
              <button
                onClick={post}
                disabled={isBusy}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Провести
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Проведён
                </div>
                <button
                  onClick={unpost}
                  disabled={isBusy}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-gray-400 px-4 text-sm font-medium transition-all border border-slate-700 hover:border-red-500/30 disabled:opacity-50"
                  title="Распровести для редактирования"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Распровести
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-4 flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0" />
          <div className="text-sm text-blue-100">
            {isDraft 
              ? "Документ в черновике. Вы можете редактировать данные и добавлять позиции." 
              : "Документ проведён. Редактирование заблокировано. Для изменений сначала нажмите «Распровести»."}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Поставщик</label>
            <select
              value={header.supplierId}
              onChange={(e) => setHeader((p) => ({ ...p, supplierId: e.target.value }))}
              disabled={!isDraft}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white disabled:opacity-50"
            >
              <option value="">—</option>
              {supplierOptions.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Локация</label>
            <select
              value={header.locationId}
              onChange={(e) => setHeader((p) => ({ ...p, locationId: e.target.value }))}
              disabled={!isDraft}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white disabled:opacity-50"
            >
              <option value="">—</option>
              {locationOptions.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Номер накладной</label>
            <input
              value={header.documentNo}
              onChange={(e) => setHeader((p) => ({ ...p, documentNo: e.target.value }))}
              disabled={!isDraft}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white disabled:opacity-50 font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Дата (МСК)</label>
            <input
              type="date"
              value={header.receivedAt}
              onChange={(e) => setHeader((p) => ({ ...p, receivedAt: e.target.value }))}
              disabled={!isDraft}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Накладная (файл)</label>
            <div className="flex gap-2">
              <label className={`inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white ${isDraft ? "bg-slate-800 hover:bg-slate-700 cursor-pointer" : "bg-slate-800/40 cursor-not-allowed"}`}>
                <input type="file" className="hidden" disabled={!isDraft || isBusy} onChange={(e) => onUpload(e.target.files)} />
                <Upload className="w-4 h-4 mr-2" />
                Загрузить
              </label>
              {header.attachmentUrl ? (
                <Link
                  href={header.attachmentUrl}
                  target="_blank"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 transition-colors"
                >
                  Открыть
                </Link>
              ) : null}
            </div>
          </div>
          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-medium text-gray-400 ml-1">Комментарий</label>
            <input
              value={header.comment}
              onChange={(e) => setHeader((p) => ({ ...p, comment: e.target.value }))}
              disabled={!isDraft}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white disabled:opacity-50"
            />
          </div>
        </div>

        {isDraft ? (
          <button
            onClick={saveHeader}
            disabled={isBusy || header.documentNo.trim().length === 0}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-5 text-sm font-semibold disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Сохранить
          </button>
        ) : null}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-white font-semibold">Позиции</div>
          <div className="text-sm text-gray-300">
            Итого: <span className="text-white font-bold">{formatRub(totalKopeks)}</span>
          </div>
        </div>

        {isDraft ? (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Товар (если уже есть)</label>
              <select
                value={itemForm.productId}
                onChange={(e) => setItemForm((p) => ({ ...p, productId: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white"
              >
                <option value="">—</option>
                {productOptions.slice(0, 800).map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                    {p.sku ? ` (${p.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">SKU (опц.)</label>
              <input
                value={itemForm.sku}
                onChange={(e) => setItemForm((p) => ({ ...p, sku: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white font-mono"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Наименование</label>
              <input
                value={itemForm.productName}
                onChange={(e) => setItemForm((p) => ({ ...p, productName: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Кол-во</label>
              <input
                value={itemForm.quantity}
                onChange={(e) => setItemForm((p) => ({ ...p, quantity: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Ед.</label>
              <select
                value={itemForm.unit}
                onChange={(e) => setItemForm((p) => ({ ...p, unit: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white"
              >
                <option value="pcs">шт</option>
                <option value="kg">кг</option>
                <option value="m">м</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Закупка ₽/ед.</label>
              <input
                value={itemForm.unitCostRub}
                onChange={(e) => setItemForm((p) => ({ ...p, unitCostRub: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-white"
              />
            </div>
            <div className="md:col-span-6">
              <button
                onClick={addItem}
                disabled={isBusy || itemForm.productName.trim().length < 2 || String(itemForm.unitCostRub).trim().length === 0}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Добавить позицию
              </button>
            </div>
          </div>
        ) : null}

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
              <tr>
                <th className="p-4 text-left font-medium">Товар</th>
                <th className="p-4 text-right font-medium">Кол-во</th>
                <th className="p-4 text-right font-medium">Цена</th>
                <th className="p-4 text-right font-medium">Сумма</th>
                <th className="p-4 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {receipt.items.map((i) => (
                <tr key={i.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-4">
                    <div className="text-white font-medium">{i.productName}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{i.sku || "—"}</div>
                  </td>
                  <td className="p-4 text-right text-gray-200">
                    {i.quantity} {i.unit}
                  </td>
                  <td className="p-4 text-right text-gray-200">{formatRub(i.unitCostKopeks)}</td>
                  <td className="p-4 text-right text-white font-semibold">{formatRub(i.totalCostKopeks)}</td>
                  <td className="p-4 text-right">
                    {isDraft ? (
                      <button
                        onClick={() => removeItem(i.id)}
                        disabled={isBusy}
                        className="inline-flex p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {receipt.items.length === 0 ? <div className="p-8 text-center text-gray-500">Нет позиций</div> : null}
        </div>
      </div>
    </div>
  );
}
