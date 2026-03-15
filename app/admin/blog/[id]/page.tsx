
import ArticleForm from "../article-form";
import { getArticleById } from "@/app/actions/blog";
import { notFound } from "next/navigation";

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(parseInt(id));

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Редактирование статьи</h1>
      </div>
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <ArticleForm article={article} />
      </div>
    </div>
  );
}
