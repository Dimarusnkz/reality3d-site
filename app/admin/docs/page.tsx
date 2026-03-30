import { getAllDocs } from "@/lib/docs";
import Link from "next/link";
import { Book, Shield, Users, CreditCard, Truck, HelpCircle } from "lucide-react";

export default async function AdminDocsPage() {
  const docs = await getAllDocs();
  
  const categories = [
    { id: 'public', name: 'Публичные страницы', icon: Book, color: 'text-blue-400' },
    { id: 'admin', name: 'Внутренние регламенты', icon: Shield, color: 'text-red-400' },
    { id: 'lk', name: 'Личный кабинет', icon: Users, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">База знаний</h1>
        <p className="text-slate-400">Документация, регламенты и инструкции Reality3D</p>
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
                  <Link 
                    key={doc.slug}
                    href={cat.id === 'public' ? `/info/${doc.slug}` : `/admin/docs/${doc.slug}`}
                    className="block p-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    {doc.title}
                  </Link>
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
