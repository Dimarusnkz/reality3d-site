"use client";

import { Mail, MapPin, Phone, Clock, MessageSquare, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactsPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase">Контакты</h1>
        <p className="text-gray-500 max-w-2xl mx-auto font-bold uppercase tracking-widest text-[10px]">
          Get in touch with our team in Saint Petersburg
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        <div className="neon-card p-8 rounded-3xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <MapPin className="h-16 w-16 text-primary" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Адрес студии</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Санкт-Петербург, пр. Современиков 1к3<br />
              (вход со двора, цокольный этаж)
            </p>
            <a 
              href="https://yandex.com/maps/10174/saint-petersburg-and-leningrad-oblast/house/ulitsa_sovremennikov_1k3/Z0kYdwBgS0MHQFtjfXt4c35gYw==/?ll=30.170260%2C59.792237&z=16.83" 
              target="_blank" 
              className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-colors"
            >
              Открыть на карте →
            </a>
          </div>
        </div>

        <div className="neon-card p-8 rounded-3xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Phone className="h-16 w-16 text-blue-400" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
              <Phone className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Связь с нами</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              +7 (923) 631-7850<br />
              zakaz@reality3d.ru
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="https://t.me/Reality_3Dtg" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] hover:text-white transition-colors">Telegram</a>
              <a href="https://max.ru/join/4YSX3vkvUjYNPAqayBmTLJuEmr0pBy65drrrrOOm6qg" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] hover:text-white transition-colors">Max</a>
              <a href="https://vk.com/Reality3DSPB" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-white transition-colors">VK</a>
            </div>
          </div>
        </div>

        <div className="neon-card p-8 rounded-3xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="h-16 w-16 text-purple-400" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Режим работы</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              Пн — Пт: 10:00 - 20:00<br />
              Сб — Вс: 11:00 - 18:00
            </p>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Производство 24/7
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
