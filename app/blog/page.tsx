import { getArticles } from "@/app/actions/blog";
import Link from "next/link";
import { Calendar, User } from "lucide-react";

export const metadata = {
  title: "Блог о 3D печати",
  description: "Статьи, новости и полезные советы из мира 3D печати. Технологии FDM, SLA, SLS, материалы и кейсы.",
};

export default async function BlogPage() {
  const articles = await getArticles(true);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Блог Reality3D</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Погрузитесь в мир аддитивных технологий. Мы делимся опытом, рассказываем о новинках и помогаем разобраться в тонкостях 3D печати.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <Link 
            href={`/blog/${article.slug}`} 
            key={article.id}
            className="group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 flex flex-col"
          >
            <div className="aspect-video relative bg-slate-800 overflow-hidden">
              {/* Placeholder for image if real image handling is added later */}
              <img 
                src={article.coverImage || "https://placehold.co/600x400/1e293b/ffffff?text=No+Image"} 
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                </div>
                {article.author && (
                    <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {article.author.name || 'Admin'}
                    </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {article.title}
              </h2>
              <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                {article.excerpt}
              </p>
              <span className="text-primary text-sm font-medium flex items-center gap-1 mt-auto">
                Читать далее &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
