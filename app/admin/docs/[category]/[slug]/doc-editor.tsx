"use client";

import { useState, useTransition } from "react";
import { updateDoc } from "@/app/actions/docs";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

interface EditorProps {
  category: string;
  slug: string;
  initialContent: string;
  initialMetadata: any;
}

export function DocEditor({ category, slug, initialContent, initialMetadata }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialMetadata.title || "");
  const [description, setDescription] = useState(initialMetadata.description || "");
  const [isPreview, setIsPreview] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateDoc(
        category,
        slug,
        content,
        { ...initialMetadata, title, description },
        getCsrfToken()
      );

      if (res.ok) {
        router.refresh();
        alert("Сохранено успешно!");
      } else {
        alert(res.error || "Ошибка сохранения");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/docs" 
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Редактирование статьи</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {isPreview ? "Редактор" : "Предпросмотр"}
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">Заголовок</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Заголовок статьи"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">Описание (SEO)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Краткое описание"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase">
              Контент (Markdown)
            </label>
            {isPreview ? (
              <div className="min-h-[500px] w-full bg-slate-950 border border-slate-800 rounded-lg p-8 prose prose-invert prose-orange max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[500px] bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y"
                placeholder="Пишите статью здесь (поддерживается Markdown)..."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
