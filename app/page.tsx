"use client";

import RequestForm from "@/components/request-form";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Clock, Truck, ShieldCheck, Cpu, FileText, Layers, Zap, Upload, Calculator, Printer, CheckCircle2, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { usePortfolio } from "@/app/context/portfolio-context";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

function useInViewOnce<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, options]);

  return { ref, inView };
}

function AnimatedNumber({
  value,
  suffix,
  durationMs = 1400,
}: {
  value: number;
  suffix?: string;
  durationMs?: number;
}) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>({ threshold: 0.3 });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const start = performance.now();
    const from = 0;
    const to = value;

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setCurrent(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, inView, value]);

  const formatted = useMemo(() => new Intl.NumberFormat("ru-RU").format(current), [current]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-white text-glow">
      {formatted}
      {suffix || ""}
    </span>
  );
}

export default function Home() {
  const { projects } = usePortfolio();
  const featuredProjects = useMemo(() => projects.slice(0, 3), [projects]);

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
                3D-печать: где фантазия <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400 text-glow">
                  становится осязаемой
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-[600px]">
                Профессиональная студия 3D печати. Изготовление прототипов, макетов и деталей любой сложности. 
                FDM, SLA, SLS технологии. Доставка по всей России.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                <Link 
                  href="/calculator" 
                  className="group relative flex flex-col p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-primary/50 transition-all duration-500 overflow-hidden hover:shadow-[0_0_40px_rgba(255,94,0,0.15)]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                    <Calculator className="w-24 h-24 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <Calculator className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors">Рассчитать 3D‑печать</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      Загрузите STL модель или укажите параметры для мгновенного расчета стоимости
                    </p>
                    <div className="flex items-center text-primary font-bold text-sm uppercase tracking-wider group-hover:gap-2 transition-all">
                      Начать расчет <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </Link>

                <Link 
                  href="/shop" 
                  className="group relative flex flex-col p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-blue-500/50 transition-all duration-500 overflow-hidden hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                    <ShoppingCart className="w-24 h-24 text-blue-400" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                      <ShoppingCart className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Купить в магазине</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      Готовые детали, материалы и оборудование в наличии с доставкой
                    </p>
                    <div className="flex items-center text-blue-400 font-bold text-sm uppercase tracking-wider group-hover:gap-2 transition-all">
                      Перейти в каталог <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </div>

              <div className="text-sm text-gray-500 flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Принимаем заказы</span>
                </div>
                <div className="h-4 w-px bg-slate-800"></div>
                <div className="space-x-4">
                  <Link href="/login" className="hover:text-white transition-colors">Войти</Link>
                  <Link href="/register" className="hover:text-white transition-colors">Регистрация</Link>
                </div>
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
                 <a href="#request-form" className="absolute -bottom-10 -left-10 w-40 h-40 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 flex flex-col items-center justify-center shadow-2xl border-glow animate-bounce delay-700 cursor-pointer hover:bg-slate-800 transition-all z-20 group no-underline">
                     <span className="text-xl font-bold text-white neon-flicker text-center leading-tight group-hover:scale-105 transition-transform">
                       Оставить<br/>заявку
                     </span>
                  </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 md:py-20 bg-black border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-950/50">
              <AnimatedNumber value={100} suffix="+" />
              <div className="mt-2 text-sm text-gray-400">Материалов в наличии</div>
            </div>
            <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-950/50">
              <AnimatedNumber value={50} suffix=" мкм" />
              <div className="mt-2 text-sm text-gray-400">Точность печати</div>
            </div>
            <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-950/50">
              <AnimatedNumber value={24} suffix="/7" />
              <div className="mt-2 text-sm text-gray-400">Производство</div>
            </div>
            <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-950/50">
              <AnimatedNumber value={1000} suffix="+" />
              <div className="mt-2 text-sm text-gray-400">Реализованных деталей</div>
            </div>
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

      {/* How We Work */}
      <section className="py-20 bg-black border-t border-slate-800">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Как мы работаем</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Быстрый и понятный процесс: от заявки до готовой детали.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Upload,
                title: "Заявка",
                text: "Опишите задачу и приложите модель (STL/OBJ/STEP) или чертеж.",
              },
              {
                icon: Calculator,
                title: "Расчет",
                text: "Подбираем технологию и материал, согласуем сроки и стоимость.",
              },
              {
                icon: Printer,
                title: "Печать",
                text: "Запускаем производство, выполняем постобработку при необходимости.",
              },
              {
                icon: CheckCircle2,
                title: "Выдача",
                text: "Самовывоз в СПб или доставка по России. Контроль качества перед отправкой.",
              },
            ].map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-950/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(255,94,0,0.15)]">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">Шаг {idx + 1}</div>
                  </div>
                  <div className="text-xl font-bold text-white mb-2">{step.title}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{step.text}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#request-form" className="neon-button text-lg">
              Оставить заявку
            </a>
            <Link
              href="/calculator"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 px-8 text-base font-medium text-white transition-all hover:bg-slate-800 hover:border-slate-500"
            >
              Рассчитать стоимость
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-20 bg-slate-950 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-slate-950 to-black" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">Портфолио работ</h2>
              <p className="text-gray-400 max-w-2xl">
                Примеры изделий: прототипы, макеты, корпуса, миниатюры и функциональные детали.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/portfolio" className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/50 px-6 text-base font-medium text-white transition-all hover:bg-slate-800 hover:border-slate-500">
                Смотреть все
              </Link>
              <a href="#request-form" className="neon-button text-lg">
                Хочу так же
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-black/40 hover:border-primary/50 transition-all"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Image
                    src={project.imageUrl}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-xs font-bold text-white rounded-full border border-white/10">
                      {project.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-lg font-bold text-white mb-1">{project.title}</div>
                  <div className="text-sm text-gray-400 line-clamp-2">{project.description}</div>
                </div>
              </motion.div>
            ))}
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
               
               <div className="relative scroll-mt-32" id="request-form">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                  <RequestForm />
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
              "telephone": "+7-923-631-7850",
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
