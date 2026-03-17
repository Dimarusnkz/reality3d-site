"use client";

import { useMemo, useState } from "react";
import { createShopProduct, updateShopProduct } from "@/app/actions/shop-admin";
import { Loader2 } from "lucide-react";

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
  shortDescription: string;
  description: string;
  priceRub: number;
  compareAtRub: number | null;
  stock: number;
  isActive: boolean;
  categoryId: number | null;
  imageUrl: string;
};

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: {
    id: number;
    name: string;
    slug: string;
    sku: string | null;
    shortDescription: string | null;
    description: string | null;
    priceKopeks: number;
    compareAtKopeks: number | null;
    stock: number;
    isActive: boolean;
    categoryId: number | null;
  };
}) {
  const initial = useMemo<ProductInput>(
    () => ({
      name: product?.name || "",
      slug: product?.slug || "",
      sku: product?.sku || "",
      shortDescription: product?.shortDescription || "",
      description: product?.description || "",
      priceRub: (product?.priceKopeks || 0) / 100,
      compareAtRub: product?.compareAtKopeks == null ? null : product.compareAtKopeks / 100,
      stock: product?.stock ?? 0,
      isActive: product?.isActive ?? true,
      categoryId: product?.categoryId ?? null,
      imageUrl: "",
    }),
    [product]
  );

  const [form, setForm] = useState<ProductInput>(initial);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        sku: form.sku || null,
        shortDescription: form.shortDescription || null,
        description: form.description || null,
        priceRub: Number(form.priceRub),
        compareAtRub: form.compareAtRub == null ? null : Number(form.compareAtRub),
        stock: Number(form.stock),
        isActive: Boolean(form.isActive),
        categoryId: form.categoryId == null ? null : Number(form.categoryId),
        imageUrl: form.imageUrl || null,
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
        setForm({ ...form, imageUrl: "" });
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
          <label className="text-sm font-medium text-gray-400 ml-1">Цена (₽)</label>
          <input
            type="number"
            inputMode="decimal"
            value={form.priceRub}
            onChange={(e) => setForm({ ...form, priceRub: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

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
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">URL изображения (первое)</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
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

