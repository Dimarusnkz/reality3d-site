"use client";

import { useMemo, useState } from "react";
import { updateShopProductCard } from "@/app/actions/shop-admin";
import { Loader2, ImagePlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type ProductCardInput = {
  shortDescription: string;
  description: string;
  imageUrls: string[];
};

export function ProductCardForm({
  product,
}: {
  product: {
    id: number;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    imageUrls: string[];
  };
}) {
  const initial = useMemo<ProductCardInput>(
    () => ({
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      imageUrls: product.imageUrls || [],
    }),
    [product]
  );

  const [form, setForm] = useState<ProductCardInput>(initial);
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
        shortDescription: form.shortDescription || null,
        description: form.description || null,
        imageUrls: form.imageUrls,
      };

      const csrf = getCsrfToken();
      const res = await updateShopProductCard(product.id, payload, csrf);
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.href = "/admin/shop/products";
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm text-gray-400">Товар</div>
        <div className="text-white font-semibold text-lg">{product.name}</div>
        <div className="text-xs text-gray-500 font-mono mt-1">/{product.slug}</div>
      </div>

      <div className="space-y-3">
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
          <div className="text-xs text-gray-500">JPG/PNG/WebP, максимум 10 фото. Хранение на сервере.</div>
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
        ) : (
          <div className="text-sm text-gray-500">Нет фото</div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400 ml-1">Короткое описание</label>
        <input
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400 ml-1">Описание</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[240px]"
        />
      </div>

      <button
        onClick={submit}
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Сохранить карточку
      </button>
    </div>
  );
}

