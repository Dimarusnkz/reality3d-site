import { getArticleBySlug, getArticles } from "@/app/actions/blog";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Статья не найдена" };

  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt || "",
      type: "article",
      publishedTime: article.createdAt.toISOString(),
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

export async function generateStaticParams() {
  const articles = await getArticles(true);
  return articles.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-black">
      {/* Hero Header with Image */}
      <div className="relative h-[400px] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <img 
          src={article.coverImage || "https://placehold.co/1200x600/1e293b/ffffff?text=Article"} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 container mx-auto px-4 pb-12">
          <Link href="/blog" className="inline-flex items-center text-primary hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад в блог
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(article.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {article.author && (
                <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {article.author.name || 'Admin'}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div 
            className="prose prosemirror-dark prose-lg prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-primary hover:prose-a:text-primary/80 prose-li:text-gray-300"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </article>
  );
}
