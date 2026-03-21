"use client";

import { Search, Calculator } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

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

      <EmptyState
        icon={Calculator}
        title="Расчётов пока нет"
        description="История предварительных расчётов очищена. Создайте новый расчёт в калькуляторе."
        actions={
          <LinkButton href="/calculator" size="sm">
            Перейти в калькулятор
          </LinkButton>
        }
      />
    </div>
  );
}
