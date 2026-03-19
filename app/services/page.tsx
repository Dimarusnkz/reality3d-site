import { Wrench, Printer, Box, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Наши услуги</h1>
        <p className="text-lg text-gray-400">
          Полный цикл создания деталей: от идеи и 3D-модели до готового изделия с постобработкой.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="neon-card p-8 rounded-2xl flex flex-col items-center text-center border border-slate-800 bg-slate-900/50 hover:border-primary/40 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Printer className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">3D Печать</h2>
          <p className="text-gray-400 mb-6 flex-1">
            Изготовление деталей любой сложности из пластика (FDM), фотополимера (SLA) и полиамида (SLS).
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-8 text-left w-full">
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Прототипы и макеты</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Функциональные детали</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" />Мелкосерийное производство</li>
          </ul>
          <ButtonLink href="/calculator" className="w-full">
            Рассчитать печать
          </ButtonLink>
        </div>

        <div className="neon-card p-8 rounded-2xl flex flex-col items-center text-center border border-slate-800 bg-slate-900/50 hover:border-blue-500/40 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
            <Box className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">3D Моделирование</h2>
          <p className="text-gray-400 mb-6 flex-1">
            Разработка 3D-моделей по чертежам, эскизам, фотографиям или сломанным образцам.
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-8 text-left w-full">
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />Инженерное моделирование</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />Художественная лепка</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" />Доработка готовых моделей</li>
          </ul>
          <ButtonLink href="/#request-form" variant="secondary" className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
            Оставить заявку
          </ButtonLink>
        </div>

        <div className="neon-card p-8 rounded-2xl flex flex-col items-center text-center border border-slate-800 bg-slate-900/50 hover:border-purple-500/40 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
            <Wrench className="h-8 w-8 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">Постобработка</h2>
          <p className="text-gray-400 mb-6 flex-1">
            Доведение напечатанных деталей до финального вида: удаление поддержек, шлифовка, покраска.
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-8 text-left w-full">
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" />Склейка больших деталей</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" />Грунтовка и покраска</li>
            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" />Установка закладных гаек</li>
          </ul>
          <ButtonLink href="/#request-form" variant="secondary" className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
            Обсудить задачу
          </ButtonLink>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Готовы начать проект?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Загрузите вашу 3D-модель в калькулятор для мгновенного расчета стоимости печати или оставьте заявку на моделирование.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ButtonLink href="/calculator" size="lg" className="w-full sm:w-auto">
              Калькулятор 3D-печати
            </ButtonLink>
            <ButtonLink href="/#request-form" variant="outline" size="lg" className="w-full sm:w-auto">
              Оставить заявку
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
