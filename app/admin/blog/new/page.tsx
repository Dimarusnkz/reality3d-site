
import ArticleForm from "../article-form";

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Создание новой статьи</h1>
      </div>
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <ArticleForm />
      </div>
    </div>
  );
}
