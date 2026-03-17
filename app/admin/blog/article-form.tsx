"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createArticle, updateArticle } from "@/app/actions/blog";
import { Save, ArrowLeft, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export default function ArticleForm({ article }: { article?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    coverImage: article?.coverImage || "",
    published: article?.published || false,
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'content') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      });

      if (!res.ok) throw new Error('Upload failed');

      const { url } = await res.json();
      
      if (field === 'coverImage') {
        setFormData(prev => ({ ...prev, coverImage: url }));
      } else {
        // For content, we just copy to clipboard or append to content? 
        // Let's append an img tag to the content for convenience
        const imgTag = `\n<img src="${url}" alt="${file.name}" />\n`;
        setFormData(prev => ({ ...prev, content: prev.content + imgTag }));
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[а-яё]/g, (char) => {
        const ru: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
            'я': 'ya'
        };
        return ru[char] || char;
      });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ 
        ...prev, 
        title, 
        slug: !article ? generateSlug(title) : prev.slug // Auto-generate slug only for new articles
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const csrfToken = (() => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; csrf_token=`);
      if (parts.length !== 2) return '';
      return parts.pop()?.split(';').shift() || '';
    })();

    const dataWithCsrf = { ...formData, csrfToken };
    const result = article
      ? await updateArticle(article.id, dataWithCsrf)
      : await createArticle(dataWithCsrf);

    if (result.success) {
      router.push("/admin/blog");
    } else {
      alert("Ошибка при сохранении");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/admin/blog" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Заголовок</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">URL (Slug)</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-gray-300 font-mono text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Контент (HTML)</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-primary outline-none font-mono text-sm h-[500px]"
                placeholder="<p>Текст статьи...</p>"
              />
              <p className="text-xs text-gray-500 mt-1">Поддерживается HTML разметка</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-white">Настройки</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-primary focus:ring-primary"
              />
              <label htmlFor="published" className="text-white cursor-pointer select-none">Опубликовано</label>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-white">Мета-данные</h3>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Краткое описание (Excerpt)</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-primary outline-none h-32 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Ссылка на обложку</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:border-primary outline-none text-sm"
                  placeholder="https://..."
                />
                <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors text-sm justify-center">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    <span>Загрузить обложку</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'coverImage')} disabled={uploading} />
                </label>
              </div>
              {formData.coverImage && (
                <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-slate-800 relative bg-black/50">
                    <Image
                      src={formData.coverImage}
                      alt="Preview"
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-800">
                <label className="block text-sm font-medium text-gray-400 mb-2">Добавить изображение в статью</label>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors text-sm justify-center w-full">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    <span>Загрузить и добавить в текст</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'content')} disabled={uploading} />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                    Изображение будет автоматически добавлено в конец текста статьи. Вы можете переместить тег &lt;img&gt; в нужное место.
                </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
