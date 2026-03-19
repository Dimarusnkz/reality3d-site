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
              href="https://yandex.ru/maps/-/CCUf6-u-pA" 
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
            <div className="flex gap-4">
              <a href="https://t.me/reality3d" className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] hover:text-white transition-colors">Telegram</a>
              <a href="https://wa.me/79236317850" className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] hover:text-white transition-colors">WhatsApp</a>
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

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Напишите нам</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md">
              Есть вопросы или хотите обсудить проект? Оставьте сообщение, и наш менеджер свяжется с вами в течение 15 минут.
            </p>
          </div>

          <form className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Ваше имя</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary transition-all"
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Телефон / Telegram</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary transition-all"
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">Сообщение</label>
              <textarea 
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-primary transition-all resize-none"
                placeholder="Расскажите о вашей задаче..."
              />
            </div>
            <button className="w-full sm:w-auto px-10 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
              Отправить сообщение
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="h-[450px] rounded-3xl overflow-hidden border border-slate-800 relative group grayscale hover:grayscale-0 transition-all duration-700">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-white font-bold text-sm">Мы находимся здесь</p>
             </div>
          </div>
          <iframe 
            src="https://yandex.ru/map-widget/v1/?um=constructor%3A999c0d9c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c0e0c&amp;source=constructor" 
            width="100%" 
            height="100%" 
            frameBorder="0"
            className="relative z-0"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
