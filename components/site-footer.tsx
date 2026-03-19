"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  const pathname = usePathname();

  // Hide footer on admin and lk (personal cabinet) pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/lk")) {
    return null;
  }

  return (
    <footer className="w-full border-t border-slate-800 bg-black py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_10px_rgba(255,94,0,0.5)]"></div>
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
        <div className="space-y-4">
          <Link className="flex items-center gap-2 font-bold text-xl text-white" href="/">
            Reality3D
          </Link>
          <p className="text-sm text-gray-400">
            Профессиональная 3D-печать в Санкт-Петербурге. От идеи до реализации.
          </p>
          <div className="flex gap-4">
            {/* Social icons would go here */}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">Навигация</h3>
          <ul className="space-y-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            <li><Link href="/services" className="hover:text-primary transition-colors">Услуги</Link></li>
            <li><Link href="/portfolio" className="hover:text-primary transition-colors">Портфолио</Link></li>
            <li><Link href="/blog" className="hover:text-primary transition-colors">Блог</Link></li>
            <li><Link href="/materials" className="hover:text-primary transition-colors">Материалы</Link></li>
            <li><Link href="/reviews" className="hover:text-primary transition-colors">Отзывы</Link></li>
            <li><Link href="/contacts" className="hover:text-primary transition-colors">Контакты</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">Услуги</h3>
          <ul className="space-y-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            <li><Link href="/services" className="hover:text-primary transition-colors">FDM Печать</Link></li>
            <li><Link href="/services" className="hover:text-primary transition-colors">SLA Печать</Link></li>
            <li><Link href="/services" className="hover:text-primary transition-colors">SLS Печать</Link></li>
            <li><Link href="/services" className="hover:text-primary transition-colors">Моделирование</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">Контакты</h3>
          <ul className="space-y-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            <li className="flex items-center gap-2 group">
              <MapPin className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="group-hover:text-white transition-colors">СПб, пр. Современиков 1к3</span>
            </li>
            <li className="flex items-center gap-2 group">
              <Phone className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span className="group-hover:text-white transition-colors">+7 (923) 631-7850</span>
            </li>
            <li className="flex items-center gap-2 group">
               <Mail className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
               <span className="group-hover:text-white transition-colors">zakaz@reality3d.ru</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-900 text-center text-xs text-gray-600">
         © 2026 Reality3D. Все права защищены.
      </div>
    </footer>
  );
}
