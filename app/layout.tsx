import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
// import { Menu, Phone, Mail, MapPin } from "lucide-react"; // Menu removed
import { Phone, Mail, MapPin } from "lucide-react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Reality3D - Студия 3D печати СПб",
    default: "3D печать на заказ в Санкт-Петербурге | Reality3D"
  },
  description: "Профессиональная 3D печать на заказ в Санкт-Петербурге. FDM, SLA, SLS технологии. Изготовление прототипов, архитектурных макетов и деталей. Рассчитайте стоимость 3D печати онлайн.",
  keywords: ["3d печать на заказ санкт-петербург", "студия 3d печати спб", "заказать 3d печать в санкт-петербурге", "калькулятор 3d печати онлайн", "3d печать прототипов спб", "3d печать архитектурных макетов петербург"],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://reality3d.ru",
    title: "3D печать на заказ в Санкт-Петербурге | Reality3D",
    description: "Студия 3D печати в СПб. Расчет стоимости онлайн, быстрое изготовление, доставка.",
    siteName: "Reality3D",
  }
};

import { ChatProvider } from "@/app/components/chat/chat-provider";
import { ChatWidget } from "@/app/components/chat/chat-widget";
import { PortfolioProvider } from "@/app/context/portfolio-context";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/session";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  return (
    <html lang="ru" className="dark">
      <body className={cn(inter.className, "min-h-screen bg-black text-slate-200 flex flex-col")}>
        <PortfolioProvider>
          <ChatProvider>
            <SiteHeader user={session as any} />

            <main className="flex-1">{children}</main>

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
                <h3 className="font-bold text-white">Навигация</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/services" className="hover:text-primary hover:underline transition-colors">Услуги</Link></li>
                  <li><Link href="/portfolio" className="hover:text-primary hover:underline transition-colors">Портфолио</Link></li>
                  <li><Link href="/equipment" className="hover:text-primary hover:underline transition-colors">Оборудование</Link></li>
                  <li><Link href="/blog" className="hover:text-primary hover:underline transition-colors">Блог</Link></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-white">Услуги</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/services" className="hover:text-primary hover:underline transition-colors">FDM Печать</Link></li>
                  <li><Link href="/services" className="hover:text-primary hover:underline transition-colors">SLA Печать</Link></li>
                  <li><Link href="/services" className="hover:text-primary hover:underline transition-colors">SLS Печать</Link></li>
                  <li><Link href="/services" className="hover:text-primary hover:underline transition-colors">Моделирование</Link></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-white">Контакты</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>СПб, пр. Современиков 1к3</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>+7 (812) 999-00-00</span>
                  </li>
                  <li className="flex items-center gap-2">
                     <Mail className="h-4 w-4 text-primary" />
                     <span>zakaz@reality3d.ru</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-900 text-center text-xs text-gray-600">
               © 2026 Reality3D. Все права защищены.
            </div>
          </footer>
            <ChatWidget />
            </ChatProvider>
          </PortfolioProvider>
      </body>
    </html>
  );
}
