"use client";

import { ArrowUpRight, ArrowDownRight, Users, ShoppingBag, DollarSign, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Панель управления</h1>
        <p className="text-gray-400">Обзор ключевых показателей бизнеса</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                 <ShoppingBag className="h-5 w-5 text-blue-500" />
              </div>
              <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                 +12% <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>
           </div>
           <div className="text-3xl font-bold text-white mb-1">24</div>
           <p className="text-sm text-gray-400">Новых заказов сегодня</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                 <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                 +5.4% <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>
           </div>
           <div className="text-3xl font-bold text-white mb-1">128.5k ₽</div>
           <p className="text-sm text-gray-400">Выручка за неделю</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                 <Users className="h-5 w-5 text-purple-500" />
              </div>
              <span className="flex items-center text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
                 -2% <ArrowDownRight className="h-3 w-3 ml-1" />
              </span>
           </div>
           <div className="text-3xl font-bold text-white mb-1">8</div>
           <p className="text-sm text-gray-400">Новых клиентов</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                 <Activity className="h-5 w-5 text-orange-500" />
              </div>
           </div>
           <div className="text-3xl font-bold text-white mb-1">85%</div>
           <p className="text-sm text-gray-400">Загрузка оборудования</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Recent Orders List */}
         <div className="lg:col-span-2 border border-slate-800 bg-slate-900/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Последние заказы</h3>
            <div className="space-y-4">
               {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-gray-400">
                           #{120 + i}
                        </div>
                        <div>
                           <p className="font-medium text-white">Прототип корпуса v{i}</p>
                           <p className="text-xs text-gray-500">FDM / PLA / Черный</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="font-bold text-white">4,500 ₽</p>
                        <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">В работе</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* System Status / Alerts */}
         <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Статус системы</h3>
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between text-sm mb-2">
                     <span className="text-gray-400">FDM Принтеры (5/6)</span>
                     <span className="text-green-500">Онлайн</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 w-[83%]"></div>
                  </div>
               </div>
               
               <div>
                  <div className="flex justify-between text-sm mb-2">
                     <span className="text-gray-400">SLA Принтеры (1/2)</span>
                     <span className="text-yellow-500">В обслуживании</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-yellow-500 w-[50%]"></div>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-800">
                  <h4 className="font-bold text-white mb-4">Уведомления</h4>
                  <div className="space-y-3">
                     <div className="text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200">
                        Мало материала: PETG (Черный) - осталось 200г
                     </div>
                     <div className="text-sm p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200">
                        Новое сообщение от клиента John Doe
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
