import { getDocBySlug } from "@/lib/docs";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { ArrowLeft, Edit2 } from "lucide-react";

export default async function KBArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const doc = await getDocBySlug(category, slug);

  if (!doc) notFound();

  const session = await getSession();
  const isAdmin = session?.role === 'admin';

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link 
            href="/admin/docs" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку
          </Link>
          
          {isAdmin && doc.metadata.id && (
            <Link 
              href={`/admin/kb/edit/${doc.metadata.id}`}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Править описание
            </Link>
          )}
        </div>

        <article className="prose prose-invert prose-orange max-w-none">
          <h1 className="text-4xl font-bold mb-4">{doc.metadata.title}</h1>
          <div className="text-sm text-slate-500 mb-8 uppercase tracking-widest">
            Категория: {doc.metadata.category} | Обновлено: {new Date(doc.metadata.lastUpdated).toLocaleDateString()}
          </div>
          <ReactMarkdown>{doc.content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
