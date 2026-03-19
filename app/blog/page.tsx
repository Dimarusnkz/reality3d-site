import { getArticles } from "@/app/actions/blog";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import Image from "next/image";

export const metadata = {
  title: "Блог о 3D печати",
  description: "Статьи, новости и полезные советы из мира 3D печати. Технологии FDM, SLA, SLS, материалы и кейсы.",
};

export default async function BlogPage() {
  const articles = await getArticles(true);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase">Блог Reality3D</h1>
        <p className="text-gray-500 max-w-2xl mx-auto font-bold uppercase tracking-widest text-[10px]">
          Latest news, tips and tutorials from the world of 3D printing
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <Link 
            href={`/blog/${article.slug}`} 
            key={article.id}
            className="group relative neon-card border border-slate-800 bg-slate-900/40 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,94,0,0.1)] flex flex-col"
          >
            <div className="aspect-[16/10] relative bg-slate-950 overflow-hidden">
              <Image
                src={article.coverImage || "https://placehold.co/600x400/1e293b/ffffff?text=No+Image"}
                alt={article.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60"></div>
            </div>
            <div className="p-8 flex flex-col flex-1 relative z-10">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded-lg border border-slate-800">
                  <Calendar className="w-3 h-3 text-primary/60" />
                  {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                </div>
                {article.author && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/50 rounded-lg border border-slate-800">
                      <User className="w-3 h-3 text-blue-400/60" />
                      {article.author.name || 'Admin'}
                    </div>
                )}
              </div>
              <h2 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary group-hover:gap-4 transition-all duration-300">
                Читать далее <span className="text-lg">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
