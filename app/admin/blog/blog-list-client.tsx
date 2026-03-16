"use client";

import { useState } from "react";
import { deleteArticle } from "@/app/actions/blog";
import Link from "next/link";
import { Edit2, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

export default function BlogListClient({ initialArticles }: { initialArticles: any[] }) {
  const [articles, setArticles] = useState(initialArticles);

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту статью?")) return;
    
    const result = await deleteArticle(id, getCsrfToken());
    if (result.success) {
      setArticles(articles.filter(a => a.id !== id));
    } else {
      alert("Ошибка при удалении");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-950 border-b border-slate-800">
          <tr>
            <th className="text-left p-4 text-gray-400 font-medium">Заголовок</th>
            <th className="text-left p-4 text-gray-400 font-medium">Статус</th>
            <th className="text-left p-4 text-gray-400 font-medium">Дата</th>
            <th className="text-right p-4 text-gray-400 font-medium">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {articles.map((article) => (
            <tr key={article.id} className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 text-white font-medium">
                {article.title}
                <div className="text-xs text-gray-500 font-mono mt-1">/{article.slug}</div>
              </td>
              <td className="p-4">
                {article.published ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs">
                    <CheckCircle className="w-3 h-3" /> Опубликовано
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">
                    <XCircle className="w-3 h-3" /> Черновик
                  </span>
                )}
              </td>
              <td className="p-4 text-gray-400 text-sm">
                {new Date(article.createdAt).toLocaleDateString()}
              </td>
              <td className="p-4 text-right space-x-2">
                <Link 
                  href={`/blog/${article.slug}`} 
                  target="_blank"
                  className="inline-flex p-2 text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Просмотр"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <Link 
                  href={`/admin/blog/${article.id}`} 
                  className="inline-flex p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => handleDelete(article.id)}
                  className="inline-flex p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {articles.length === 0 && (
        <div className="p-8 text-center text-gray-500">Нет статей</div>
      )}
    </div>
  );
}
