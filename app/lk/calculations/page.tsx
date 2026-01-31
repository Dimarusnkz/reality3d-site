"use client";

import { Search, Download, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_CALCULATIONS = [
  { id: 1, date: '28.01.2026', tech: 'FDM', material: 'PLA (Белый)', weight: '120г', cost: 1500 },
  { id: 2, date: '27.01.2026', tech: 'SLA', material: 'Standard Resin', weight: '45г', cost: 2300 },
  { id: 3, date: '25.01.2026', tech: 'FDM', material: 'PETG (Черный)', weight: '300г', cost: 3100 },
  { id: 4, date: '20.01.2026', tech: 'SLS', material: 'PA-12', weight: '80г', cost: 5600 },
];

export default function LkCalculationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-1">Мои расчеты</h1>
           <p className="text-gray-400 text-sm">История предварительных расчетов стоимости</p>
        </div>
        
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
           <input 
             type="text" 
             placeholder="Поиск..." 
             className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
           />
        </div>
      </div>

      <div className="grid gap-4">
        {MOCK_CALCULATIONS.map((calc) => (
           <div key={calc.id} className="neon-card p-4 sm:p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-slate-900/80">
              <div className="flex-1">
                 <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold bg-slate-800 text-gray-400 px-2 py-1 rounded">#{calc.id}</span>
                    <span className="text-sm text-gray-500">{calc.date}</span>
                 </div>
                 <h3 className="text-lg font-bold text-white mb-1">
                    {calc.tech} / <span className="text-primary">{calc.material}</span>
                 </h3>
                 <p className="text-sm text-gray-400">Вес/Объем: {calc.weight}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
                 <div className="text-left sm:text-right">
                    <div className="text-sm text-gray-500">Предварительно</div>
                    <div className="text-2xl font-bold text-white">{calc.cost} ₽</div>
                 </div>
                 
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none p-3 rounded-lg border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-800 transition-colors" title="Скачать PDF">
                       <Download className="h-5 w-5" />
                    </button>
                    <button className="flex-1 sm:flex-none neon-button px-4 py-2 text-sm flex items-center justify-center gap-2">
                       <ShoppingCart className="h-4 w-4" />
                       В заказ
                    </button>
                 </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}
