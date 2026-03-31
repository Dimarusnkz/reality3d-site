"use client";

import { useState, useTransition } from "react";
import { createKBArticle, updateKBArticle, deleteKBArticle } from "@/app/actions/knowledge-base";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

interface KBEditorProps {
  initialData?: any;
  categories: { id: number; name: string; slug: string }[];
  mode: 'create' | 'edit';
}

export function KBEditor({ initialData, categories, mode }: KBEditorProps) {
  const [content, setContent] = useState(initialData?.content || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories.length > 0 ? categories[0].id : 0));
  const [isPreview, setIsPreview] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      const data = { title, slug, content, categoryId: Number(categoryId), isPublished: true };
      const res = mode === 'create' 
        ? await createKBArticle(data, getCsrfToken())
        : await updateKBArticle(initialData.id, data, getCsrfToken());

      if (res.ok) {
        router.push('/admin/docs');
        router.refresh();
      } else {
        alert(res.error || "Ошибка сохранения");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Удалить статью навсегда?")) return;
    startTransition(async () => {
      const res = await deleteKBArticle(initialData.id, getCsrfToken());
      if (res.ok) {
        router.push('/admin/docs');
        router.refresh();
      } else {
        alert(res.error || "Ошибка удаления");
      }
    });
  };

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/docs" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">{mode === 'create' ? 'Новая статья' : 'Редактирование статьи'}</h1>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'edit' && (
            <button onClick={handleDelete} className="p-2 rounded-lg bg-red-900/20 text-red-500 hover:bg-red-900/40 transition-colors mr-4">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setIsPreview(!isPreview)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors">
            <Eye className="w-4 h-4" />
            {isPreview ? "Редактор" : "Предпросмотр"}
          </button>
          <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 font-bold">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Заголовок</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Название регламента" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">URL Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono" placeholder="instrukciya-po-priemu" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Категория</label>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Содержание (Markdown)</label>
            {isPreview ? (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-6 prose prose-invert max-w-none min-h-[400px]">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono min-h-[400px]" placeholder="# Напишите содержание статьи..." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
