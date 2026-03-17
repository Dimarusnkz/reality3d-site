"use client";

import { useMemo, useState } from "react";
import { createShopCategory } from "@/app/actions/shop-admin";
import { Loader2, Plus } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Category = { id: number; name: string; slug: string; parentId: number | null };

export function CategoriesClient({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const parentOptions = useMemo(() => categories.slice().sort((a, b) => a.name.localeCompare(b.name)), [categories]);

  const submit = async () => {
    setIsSaving(true);
    try {
      const res = await createShopCategory({ name, slug, parentId }, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      setCategories((prev) => [...prev, { ...res.category, parentId }]);
      setName("");
      setSlug("");
      setParentId(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="text-white font-semibold mb-4">Добавить категорию</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="filament"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Родитель</label>
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="">Нет</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={isSaving}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Создать
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Категории</div>
        <div className="divide-y divide-slate-800">
          {categories
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{c.slug}</div>
                </div>
                <div className="text-xs text-gray-500">ID: {c.id}</div>
              </div>
            ))}
        </div>
        {categories.length === 0 ? <div className="p-8 text-center text-gray-500">Нет категорий</div> : null}
      </div>
    </div>
  );
}

