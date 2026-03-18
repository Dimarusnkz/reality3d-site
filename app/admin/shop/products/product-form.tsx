"use client";

import { useMemo, useState } from "react";
import { createShopProduct, updateShopProduct } from "@/app/actions/shop-admin";
import { Loader2, ImagePlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Category = { id: number; name: string; slug: string };

type ProductInput = {
  name: string;
  slug: string;
  sku: string;
  itemType: string;
  shortDescription: string;
  description: string;
  priceRub: number;
  purchasePriceRub: number | null;
  compareAtRub: number | null;
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  stock: number;
  allowPreorder: boolean;
  isActive: boolean;
  categoryId: number | null;
  imageUrls: string[];
};

export function ProductForm({
  categories,
  product,
  canEditPurchasePrice,
}: {
  categories: Category[];
  product?: {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    itemType: string;
    shortDescription: string | null;
    description: string | null;
    priceKopeks: number;
    purchasePriceKopeks: number | null;
    compareAtKopeks: number | null;
    weightGrams: number | null;
    lengthMm: number | null;
    widthMm: number | null;
    heightMm: number | null;
    stock: number;
    allowPreorder: boolean;
    isActive: boolean;
    categoryId: number | null;
  };
  canEditPurchasePrice?: boolean;
}) {
  const initial = useMemo<ProductInput>(
    () => ({
      name: product?.name || "",
      slug: product?.slug || "",
      sku: product?.sku || "",
      itemType: product?.itemType || "product",
      shortDescription: product?.shortDescription || "",
      description: product?.description || "",
      priceRub: (product?.priceKopeks || 0) / 100,
      purchasePriceRub: product?.purchasePriceKopeks == null ? null : product.purchasePriceKopeks / 100,
      compareAtRub: product?.compareAtKopeks == null ? null : product.compareAtKopeks / 100,
      weightGrams: product?.weightGrams ?? null,
      lengthMm: product?.lengthMm ?? null,
      widthMm: product?.widthMm ?? null,
      heightMm: product?.heightMm ?? null,
      stock: product?.stock ?? 0,
      allowPreorder: product?.allowPreorder ?? false,
      isActive: product?.isActive ?? true,
      categoryId: product?.categoryId ?? null,
      imageUrls: [],
    }),
    [product]
  );

  const [form, setForm] = useState<ProductInput>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    if (!res.ok || !json?.url) {
      throw new Error(json?.error || "Ошибка загрузки");
    }
    return json.url;
  };

  const onSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const selected = Array.from(files).slice(0, 10 - form.imageUrls.length);
      const uploaded: string[] = [];
      for (const f of selected) {
        uploaded.push(await uploadFile(f));
      }
      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...uploaded] }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
  };

  const moveImage = (from: number, dir: -1 | 1) => {
    setForm((prev) => {
      const to = from + dir;
      if (to < 0 || to >= prev.imageUrls.length) return prev;
      const next = prev.imageUrls.slice();
      const temp = next[from];
      next[from] = next[to];
      next[to] = temp;
      return { ...prev, imageUrls: next };
    });
  };

  const submit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        sku: form.sku || null,
        itemType: form.itemType || "product",
        shortDescription: form.shortDescription || null,
        description: form.description || null,
        priceRub: Number(form.priceRub),
        purchasePriceRub: canEditPurchasePrice ? (form.purchasePriceRub == null ? null : Number(form.purchasePriceRub)) : null,
        compareAtRub: form.compareAtRub == null ? null : Number(form.compareAtRub),
        weightGrams: form.weightGrams == null ? null : Number(form.weightGrams),
        lengthMm: form.lengthMm == null ? null : Number(form.lengthMm),
        widthMm: form.widthMm == null ? null : Number(form.widthMm),
        heightMm: form.heightMm == null ? null : Number(form.heightMm),
        stock: Number(form.stock),
        allowPreorder: Boolean(form.allowPreorder),
        isActive: Boolean(form.isActive),
        categoryId: form.categoryId == null ? null : Number(form.categoryId),
        imageUrls: form.imageUrls,
      };

      const csrf = getCsrfToken();
      const res = product
        ? await updateShopProduct(product.id, payload, csrf)
        : await createShopProduct(payload, csrf);

      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }

      if (!product) {
        setForm({ ...form, imageUrls: [] });
      }
      window.location.href = "/admin/shop/products";
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Название</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Slug</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="pla-filament-1kg"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Артикул</label>
          <input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Категория</label>
          <select
            value={form.categoryId ?? ""}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="">Без категории</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Тип товара</label>
          <select
            value={form.itemType}
            onChange={(e) => setForm({ ...form, itemType: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="product">Готовый продукт</option>
            <option value="material">Сырьё</option>
            <option value="packaging">Упаковка</option>
            <option value="consumable">Расходник</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Цена (₽)</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.priceRub}
            onChange={(e) => setForm({ ...form, priceRub: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {canEditPurchasePrice ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Цена закупки (₽)</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.purchasePriceRub ?? ""}
              onChange={(e) => setForm({ ...form, purchasePriceRub: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Старая цена (₽)</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.compareAtRub ?? ""}
            onChange={(e) => setForm({ ...form, compareAtRub: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Вес (г)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.weightGrams ?? ""}
            onChange={(e) => setForm({ ...form, weightGrams: e.target.value ? Number(e.target.value) : null })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Габариты упаковки (мм)</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="number"
              inputMode="numeric"
              value={form.lengthMm ?? ""}
              onChange={(e) => setForm({ ...form, lengthMm: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              placeholder="Длина"
            />
            <input
              type="number"
              inputMode="numeric"
              value={form.widthMm ?? ""}
              onChange={(e) => setForm({ ...form, widthMm: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              placeholder="Ширина"
            />
            <input
              type="number"
              inputMode="numeric"
              value={form.heightMm ?? ""}
              onChange={(e) => setForm({ ...form, heightMm: e.target.value ? Number(e.target.value) : null })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
              placeholder="Высота"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Остаток</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Предзаказ</label>
          <select
            value={form.allowPreorder ? "yes" : "no"}
            onChange={(e) => setForm({ ...form, allowPreorder: e.target.value === "yes" })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="no">Запрещён</option>
            <option value="yes">Разрешён</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Статус</label>
          <select
            value={form.isActive ? "active" : "disabled"}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="active">Активен</option>
            <option value="disabled">Скрыт</option>
          </select>
        </div>

        {!product ? (
          <div className="md:col-span-2 space-y-3">
            <label className="text-sm font-medium text-gray-400 ml-1">Фотографии товара</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => onSelectFiles(e.target.files)}
                  disabled={isUploading || form.imageUrls.length >= 10}
                />
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImagePlus className="w-4 h-4 mr-2" />}
                Добавить фото
              </label>
              <div className="text-xs text-gray-500">
                JPG/PNG/WebP, до 5MB, максимум 10 фото. Хранение на сервере.
              </div>
            </div>

            {form.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {form.imageUrls.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <img src={url} alt="" className="w-full h-28 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-2 flex items-center justify-between gap-2 bg-black/60">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-800/60 hover:bg-slate-700/70 text-white disabled:opacity-50"
                          title="Влево"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 1)}
                          disabled={idx === form.imageUrls.length - 1}
                          className="p-1 rounded bg-slate-800/60 hover:bg-slate-700/70 text-white disabled:opacity-50"
                          title="Вправо"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Короткое описание</label>
          <input
            value={form.shortDescription}
            onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-gray-400 ml-1">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[180px]"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {product ? "Сохранить" : "Создать"}
      </button>
    </div>
  );
}
