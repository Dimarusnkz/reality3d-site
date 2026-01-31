import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Package, Clock, Calculator, Plus, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function LkDashboard() {
  const session = await getSession();
  const user = session?.userId ? await prisma.user.findUnique({ where: { id: parseInt(session.userId) } }) : null;
  const name = user?.name || "Пользователь";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Добро пожаловать, {name}!</h1>
        <p className="text-gray-400">Вот сводка по вашим проектам на сегодня.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neon-card p-6 rounded-xl flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                 <Package className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">В работе</span>
           </div>
           <div>
              <div className="text-3xl font-bold text-white mb-1">2</div>
              <p className="text-sm text-gray-400">Активных заказа</p>
           </div>
        </div>

        <div className="neon-card p-6 rounded-xl flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary/10 rounded-lg">
                 <CheckCircle2 className="h-6 w-6 text-secondary" />
              </div>
           </div>
           <div>
              <div className="text-3xl font-bold text-white mb-1">14</div>
              <p className="text-sm text-gray-400">Завершенных заказов</p>
           </div>
        </div>

        <div className="neon-card p-6 rounded-xl flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                 <Calculator className="h-6 w-6 text-purple-500" />
              </div>
              <span className="text-xs text-gray-500">Сегодня</span>
           </div>
           <div>
              <div className="text-3xl font-bold text-white mb-1">1,250 ₽</div>
              <p className="text-sm text-gray-400">Последний расчет</p>
           </div>
        </div>

        <div className="neon-card p-6 rounded-xl flex flex-col justify-center gap-3 border-dashed border-slate-700 bg-transparent hover:bg-slate-900/50">
           <Link href="/lk/new-order" className="flex items-center gap-3 text-white hover:text-primary transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                 <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">Новый заказ</span>
           </Link>
           <div className="h-[1px] bg-slate-800 w-full"></div>
           <Link href="/lk/files" className="flex items-center gap-3 text-white hover:text-primary transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                 <Upload className="h-4 w-4 text-gray-400" />
              </div>
              <span className="font-medium">Загрузить модель</span>
           </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Последние заказы</h2>
            <Link href="/lk/orders" className="text-sm text-primary hover:underline flex items-center">
               Все заказы <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
         </div>
         
         <div className="neon-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-gray-400 bg-slate-900/50 border-b border-slate-800">
                     <tr>
                        <th className="px-6 py-4 font-medium">№ Заказа</th>
                        <th className="px-6 py-4 font-medium">Статус</th>
                        <th className="px-6 py-4 font-medium">Стоимость</th>
                        <th className="px-6 py-4 font-medium">Дата</th>
                        <th className="px-6 py-4 font-medium">Действия</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                     <tr className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">#124</td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              В производстве
                           </span>
                        </td>
                        <td className="px-6 py-4 text-white">4,500 ₽</td>
                        <td className="px-6 py-4 text-gray-400">28.01.2026</td>
                        <td className="px-6 py-4">
                           <button className="text-gray-400 hover:text-white hover:underline">Детали</button>
                        </td>
                     </tr>
                     <tr className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">#123</td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                              Готов к выдаче
                           </span>
                        </td>
                        <td className="px-6 py-4 text-white">1,200 ₽</td>
                        <td className="px-6 py-4 text-gray-400">25.01.2026</td>
                        <td className="px-6 py-4">
                           <button className="text-gray-400 hover:text-white hover:underline">Детали</button>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
