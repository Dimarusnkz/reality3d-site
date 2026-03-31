import { getAllDocs, getKBCategories } from "@/lib/docs";
import Link from "next/link";
import { Book, Shield, Users, HelpCircle, PenTool, Plus } from "lucide-react";

export default async function AdminDocsPage() {
  const docs = await getAllDocs();
  const dbCategories = await getKBCategories();
  
  const categories = [
    { id: 'public', name: 'Публичные страницы', icon: Book, color: 'text-blue-400' },
    { id: 'admin', name: 'Внутренние регламенты', icon: Shield, color: 'text-red-400' },
    { id: 'lk', name: 'Личный кабинет', icon: Users, color: 'text-green-400' },
    ...dbCategories.map(c => ({
      id: c.slug,
      name: c.name,
      icon: Book,
      color: c.targetRole === 'admin' ? 'text-red-500' : c.targetRole === 'employee' ? 'text-orange-400' : 'text-blue-400'
    }))
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">База знаний</h1>
          <p className="text-slate-400">Документация, регламенты и инструкции Reality3D</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/kb/new" 
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            Создать статью
          </Link>
          <div className="text-xs text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
            Режим редактирования
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const catDocs = docs.filter(d => d.category === cat.id);
          return (
            <div key={cat.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg bg-slate-800 ${cat.color}`}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-semibold text-white">{cat.name}</h2>
              </div>

              <div className="space-y-3">
                {catDocs.length > 0 ? catDocs.map((doc) => (
                  <div key={doc.slug} className="group relative">
                    <Link 
                      href={doc.isDb ? `/admin/kb/edit/${doc.id}` : `/admin/docs/${doc.category}/${doc.slug}`}
                      className="block p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 hover:text-primary hover:border-primary/30 transition-all pr-12"
                    >
                      {doc.title}
                    </Link>
                    <Link
                      href={doc.isDb ? `/admin/kb/edit/${doc.id}` : `/admin/docs/${doc.category}/${doc.slug}`}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all opacity-0 group-hover:opacity-100"
                      title="Редактировать"
                    >
                      <PenTool className="w-4 h-4" />
                    </Link>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 italic">Раздел пока пуст</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Как добавить статью?
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Все статьи хранятся в формате <code className="text-primary bg-primary/10 px-1 rounded">.md</code> (Markdown) 
          в папке <code className="text-slate-200 bg-slate-800 px-1 rounded">content/docs/[категория]</code>. 
          Просто создайте новый файл, и он автоматически появится в этом списке.
        </p>
      </div>
    </div>
  );
}
