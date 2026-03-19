import { Wrench, Printer, Box, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-7xl">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <Badge variant="secondary" className="mb-4">Наши возможности</Badge>
        <h1 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight uppercase">Услуги Reality3D</h1>
        <p className="text-xl text-gray-400 leading-relaxed">
          Полный цикл создания деталей: от идеи и 3D-модели до готового изделия с профессиональной постобработкой.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="group relative neon-card p-10 rounded-3xl flex flex-col items-center text-center border border-slate-800 bg-slate-900/40 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Printer className="w-24 h-24 text-primary" />
          </div>
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Printer className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">3D Печать</h2>
          <p className="text-gray-400 mb-8 flex-1 leading-relaxed">
            Изготовление деталей любой сложности из пластика (FDM), фотополимера (SLA) и промышленного нейлона (SLS).
          </p>
          <ul className="text-sm text-gray-500 space-y-3 mb-10 text-left w-full border-t border-slate-800 pt-8">
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-primary" />Прототипы и макеты</li>
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-primary" />Функциональные детали</li>
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-primary" />Мелкосерийное производство</li>
          </ul>
          <LinkButton href="/calculator" className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20">
            Рассчитать проект
          </LinkButton>
        </div>

        <div className="group relative neon-card p-10 rounded-3xl flex flex-col items-center text-center border border-slate-800 bg-slate-900/40 hover:border-blue-500/40 transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Box className="w-24 h-24 text-blue-500" />
          </div>
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Box className="h-10 w-10 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">Моделирование</h2>
          <p className="text-gray-400 mb-8 flex-1 leading-relaxed">
            Разработка 3D-моделей по чертежам, эскизам, фотографиям или сломанным физическим образцам.
          </p>
          <ul className="text-sm text-gray-500 space-y-3 mb-10 text-left w-full border-t border-slate-800 pt-8">
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-blue-500" />Инженерный CAD</li>
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-blue-500" />Художественный Sculpting</li>
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-blue-500" />Реверс-инжиниринг</li>
          </ul>
          <LinkButton href="/#request-form" variant="secondary" className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
            Оставить заявку
          </LinkButton>
        </div>

        <div className="group relative neon-card p-10 rounded-3xl flex flex-col items-center text-center border border-slate-800 bg-slate-900/40 hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wrench className="w-24 h-24 text-purple-500" />
          </div>
          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Wrench className="h-10 w-10 text-purple-500" />
          </div>
          <h2 className="text-3xl font-black mb-4 text-white uppercase tracking-tight">Постобработка</h2>
          <p className="text-gray-400 mb-8 flex-1 leading-relaxed">
            Доведение напечатанных деталей до финального вида: удаление поддержек, шлифовка, покраска.
          </p>
          <ul className="text-sm text-gray-500 space-y-3 mb-10 text-left w-full border-t border-slate-800 pt-8">
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-purple-500" />Сборка и склейка</li>
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-purple-500" />Химическая полировка</li>
            <li className="flex items-center gap-3 font-bold uppercase tracking-widest text-[10px]"><Check className="w-4 h-4 text-purple-500" />Профессиональная покраска</li>
          </ul>
          <LinkButton href="/#request-form" variant="secondary" className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20">
            Обсудить задачу
          </LinkButton>
        </div>
      </div>

      <div className="neon-card border border-slate-800 bg-slate-900/40 rounded-[2.5rem] p-10 md:p-20 text-center max-w-5xl mx-auto relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -ml-48 -mb-48" />
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight">Готовы начать проект?</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Загрузите вашу 3D-модель в калькулятор для мгновенного расчета стоимости или свяжитесь с нами для консультации.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <LinkButton href="/calculator" size="lg" className="w-full sm:w-auto h-16 px-12 rounded-2xl text-base font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20">
              Начать расчет
            </LinkButton>
            <LinkButton href="/#request-form" variant="outline" size="lg" className="w-full sm:w-auto h-16 px-12 rounded-2xl text-base font-black uppercase tracking-[0.2em] border-slate-700 hover:bg-slate-800">
              Оставить заявку
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
