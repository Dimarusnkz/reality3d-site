"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Truck, RefreshCcw, Star, Info, Layers, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductDetailsProps {
  description?: string;
  characteristics: {
    label: string;
    value: string;
  }[];
}

export function ProductDetails({ description, characteristics }: ProductDetailsProps) {
  const [openSections, setOpenSections] = useState<string[]>(["desc"]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const sections = [
    {
      id: "desc",
      label: "Описание товара",
      icon: Info,
      content: (
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-500 leading-relaxed text-sm">
            {description || "Описание в процессе подготовки..."}
          </p>
        </div>
      )
    },
    {
      id: "chars",
      label: "Характеристики",
      icon: Layers,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {characteristics.length > 0 ? (
            characteristics.map((c, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{c.label}</span>
                <span className="text-xs font-black text-white">{c.value}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-xs italic">Характеристики не указаны</p>
          )}
        </div>
      )
    },
    {
      id: "delivery",
      label: "Доставка и возврат",
      icon: Truck,
      content: (
        <div className="space-y-4">
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
             <Truck className="h-5 w-5 text-primary shrink-0" />
             <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Способы доставки</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">СДЭК, Почта России, Яндекс.Доставка или самовывоз в Санкт-Петербурге.</p>
             </div>
          </div>
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
             <RefreshCcw className="h-5 w-5 text-blue-400 shrink-0" />
             <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Условия возврата</h4>
                <p className="text-[10px] text-gray-500 leading-relaxed">Возврат товара надлежащего качества возможен в течение 14 дней с момента получения.</p>
             </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 pt-10">
      {sections.map((section) => {
        const isOpen = openSections.includes(section.id);
        const Icon = section.icon;
        
        return (
          <div key={section.id} className="neon-card border border-slate-800 bg-slate-900/20 rounded-3xl overflow-hidden">
            <button 
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-900/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 transition-all",
                  isOpen ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-900 text-gray-500"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-sm font-black uppercase tracking-widest transition-colors",
                  isOpen ? "text-white" : "text-gray-500"
                )}>{section.label}</span>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-gray-600" /> : <ChevronDown className="h-4 w-4 text-gray-600" />}
            </button>
            
            {isOpen && (
              <div className="p-6 pt-0 border-t border-slate-800/30 bg-slate-950/20 animate-in slide-in-from-top-2 duration-300">
                {section.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
