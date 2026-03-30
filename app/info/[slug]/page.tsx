import { getDocBySlug, getAllDocs } from "@/lib/docs";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ChevronLeft, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";

export async function generateStaticParams() {
  const docs = await getAllDocs('public');
  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDocBySlug('public', slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-slate-400 hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            На главную
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            {doc.metadata.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Обновлено: {new Date(doc.metadata.lastUpdated).toLocaleDateString('ru-RU')}
            </div>
            <div className="flex items-center text-primary font-medium px-3 py-1 bg-primary/10 rounded-full">
              <Clock className="w-4 h-4 mr-2" />
              Reality3D Помощь
            </div>
          </div>
        </header>

        {/* Content */}
        <article className="prose prose-invert prose-orange max-w-none 
          prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6
          prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2
          prose-h3:text-xl prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6
          prose-li:text-slate-300 prose-li:mb-2
          prose-strong:text-white prose-strong:font-bold
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-900/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
        ">
          <ReactMarkdown>{doc.content}</ReactMarkdown>
        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-slate-400 text-sm">
            © 2026 Reality3D. Все права защищены.
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/contacts" 
              className="text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
            >
              Связаться с нами
            </Link>
            <Link 
              href="/calculator" 
              className="text-sm font-medium text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all"
            >
              Рассчитать заказ
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
