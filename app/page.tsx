"use client";

import Link from "next/link";
import { ArrowRight, Clock, Truck, ShieldCheck, Cpu, Briefcase, FileText, Layers, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-[size:50px_50px] opacity-10"></div>
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col space-y-6"
            >
              <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary w-fit">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Работаем с физ. и юр. лицами
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                3D-печать на заказ <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400 text-glow">
                  Санкт-Петербург
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-[600px]">
                Профессиональная студия 3D печати. Изготовление прототипов, макетов и деталей любой сложности. 
                FDM, SLA, SLS технологии. Доставка по всей России.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-bold text-white shadow-[0_0_20px_rgba(255,94,0,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(255,94,0,0.6)] hover:-translate-y-1"
                  href="/register"
                >
                  Получи расчет онлайн
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 px-8 text-base font-medium text-white transition-all hover:bg-slate-800 hover:border-slate-500"
                  href="/calculator"
                >
                  Загрузи модель
                </Link>
              </div>
              
              <div className="flex items-center gap-6 pt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                   <Clock className="h-4 w-4 text-primary" />
                   <span>Срочная печать 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                   <Truck className="h-4 w-4 text-primary" />
                   <span>Доставка по РФ</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.8 }}
               className="relative mx-auto w-full max-w-[500px] aspect-square hidden lg:flex items-center justify-center"
            >
              {/* Abstract 3D shape representation */}
              <div className="relative w-full h-full">
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-[100px]"></div>
                 <div className="absolute inset-10 border border-slate-800 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-700 border-glow">
                    <div className="text-center p-8">
                       <Layers className="w-24 h-24 mx-auto text-primary mb-4" />
                       <h3 className="text-2xl font-bold text-white">Высокая точность</h3>
                       <p className="text-gray-400 mt-2">до 50 микрон</p>
                    </div>
                 </div>
                 <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-slate-800 rounded-xl border border-slate-700 flex flex-col items-center justify-center shadow-xl animate-bounce delay-700">
                    <span className="text-3xl font-bold text-white">100+</span>
                    <span className="text-xs text-gray-400">Материалов</span>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technologies Section (Competitor Inspired) */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Технологии печати</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Подберем оптимальную технологию под вашу задачу: от дешевых прототипов до функциональных деталей промышленного качества.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* FDM */}
            <div className="group relative p-1 rounded-2xl bg-transparent transition-all duration-300">
              <div className="bg-slate-950 h-full rounded-xl p-8 flex flex-col items-center text-center relative z-10 neon-card">
                <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 border border-slate-800 group-hover:border-primary/50 transition-colors">
                  <Cpu className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">FDM / FFF</h3>
                <p className="text-gray-400 mb-6 flex-grow">
                  Послойное наплавление пластика. Идеально для прототипов, корпусов, технических деталей.
                </p>
                <ul className="space-y-2 text-sm text-gray-300 mb-6 w-auto text-left self-center">
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 shrink-0"></span>Низкая стоимость</li>
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 shrink-0"></span>Большой выбор пластиков</li>
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 shrink-0"></span>Габариты до 1 метра</li>
                </ul>
                <Link href="/services#fdm" className="text-primary font-medium hover:text-orange-300 flex items-center justify-center">
                  Подробнее <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* SLA */}
            <div className="group relative p-1 rounded-2xl bg-transparent transition-all duration-300">
               <div className="bg-slate-950 h-full rounded-xl p-8 flex flex-col items-center text-center relative z-10 neon-card">
                <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 border border-slate-800 group-hover:border-secondary/50 transition-colors">
                  <Zap className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">SLA / DLP</h3>
                <p className="text-gray-400 mb-6 flex-grow">
                  Фотополимерная печать. Высочайшая детализация и гладкая поверхность. Для ювелиров, стоматологов, миниатюр.
                </p>
                <ul className="space-y-2 text-sm text-gray-300 mb-6 w-auto text-left self-center">
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-secondary rounded-full mr-2 shrink-0"></span>Точность до 25 мкм</li>
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-secondary rounded-full mr-2 shrink-0"></span>Идеальная гладкость</li>
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-secondary rounded-full mr-2 shrink-0"></span>Прозрачные материалы</li>
                </ul>
                <Link href="/services#sla" className="text-secondary font-medium hover:text-blue-300 flex items-center justify-center">
                  Подробнее <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* SLS */}
            <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-purple-500 hover:to-purple-700 transition-all duration-300">
               <div className="bg-slate-950 h-full rounded-xl p-8 flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center mb-6 border border-slate-800 group-hover:border-purple-500/50 transition-colors">
                  <Layers className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">SLS</h3>
                <p className="text-gray-400 mb-6 flex-grow">
                  Лазерное спекание порошка (Полиамид). Промышленные изделия без поддержек.
                </p>
                <ul className="space-y-2 text-sm text-gray-300 mb-6 w-auto text-left self-center">
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 shrink-0"></span>Высокая прочность</li>
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 shrink-0"></span>Сложная геометрия</li>
                  <li className="flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 shrink-0"></span>Термостойкость</li>
                </ul>
                <Link href="/services#sls" className="text-purple-500 font-medium hover:text-purple-300 flex items-center justify-center">
                  Подробнее <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & B2B Section */}
      <section className="py-20 bg-slate-900 border-t border-slate-800">
         <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
               <div>
                  <h2 className="text-3xl font-bold text-white mb-6">Надежный партнер для бизнеса</h2>
                  <p className="text-gray-400 mb-8 text-lg">
                     Мы понимаем потребности бизнеса и предлагаем гибкие условия сотрудничества. 
                     Работаем официально, предоставляем полный пакет документов.
                  </p>
                  
                  <div className="grid gap-6">
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                           <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-white">Договор и НДС</h4>
                           <p className="text-gray-400">Работаем с юридическими лицами по договору. ЭДО.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                           <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-white">Конфиденциальность (NDA)</h4>
                           <p className="text-gray-400">Гарантируем защиту вашей интеллектуальной собственности.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                           <Truck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                           <h4 className="text-xl font-bold text-white">Бесплатная доставка</h4>
                           <p className="text-gray-400">Для заказов от 10 000 руб. доставка по СПб и РФ за наш счет.</p>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                  <div className="relative bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                     <h3 className="text-2xl font-bold text-white mb-6">Оставить заявку</h3>
                     <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <input type="text" placeholder="Имя" className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" />
                           <input type="text" placeholder="Телефон" className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" />
                        </div>
                        <input type="email" placeholder="Email (для счета/КП)" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none" />
                        <textarea placeholder="Описание задачи..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none h-32"></textarea>
                        <button className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition-colors shadow-lg">
                           Получить консультацию
                        </button>
                        <p className="text-xs text-center text-gray-500">
                           Нажимая кнопку, вы соглашаетесь с политикой обработки данных.
                        </p>
                     </form>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-12 md:py-20 bg-slate-950 relative overflow-hidden border-t border-slate-800">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-slate-950 to-black"></div>
         <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">🔥 Рассчитайте стоимость — получите 5% на первый заказ!</h2>
            <p className="text-xl mb-8 text-gray-400">Войдите в личный кабинет, чтобы отследить заказ и сохранить историю расчетов</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                 href="/calculator" 
                 className="neon-button text-lg"
              >
                 Рассчитать стоимость 3D печати
              </Link>
              <Link 
                 href="/login" 
                 className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 px-8 text-base font-medium text-white transition-all hover:bg-slate-800 hover:border-slate-500"
              >
                 Войти в кабинет
              </Link>
            </div>
         </div>
      </section>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Reality3D",
            "url": "https://reality3d.ru",
            "logo": "https://reality3d.ru/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+7-812-999-00-00",
              "contactType": "customer service",
              "areaServed": "RU",
              "availableLanguage": "Russian"
            },
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "пр. Современиков 1к3",
              "addressLocality": "Санкт-Петербург",
              "postalCode": "190000",
              "addressCountry": "RU"
            },
            "sameAs": [
              "https://vk.com/reality3d",
              "https://t.me/reality3d"
            ]
          })
        }}
      />
    </div>
  );
}
