import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Script from "next/script";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://reality3d.ru'),
  title: {
    template: "%s | Reality3D - Студия 3D печати СПб",
    default: "3D печать на заказ в Санкт-Петербурге | Reality3D"
  },
  description: "Профессиональная 3D печать на заказ в Санкт-Петербурге. FDM, SLA, SLS технологии. Изготовление прототипов, архитектурных макетов и деталей. Рассчитайте стоимость 3D печати онлайн.",
  keywords: ["3d печать", "3d печать спб", "3d печать на заказ", "услуги 3d печати", "fdm печать", "sla печать", "фотополимерная печать", "прототипирование", "изготовление деталей на заказ", "3d моделирование", "печать пластиком", "печать смолой", "макетирование"],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://reality3d.ru",
    title: "3D печать на заказ в Санкт-Петербурге | Reality3D",
    description: "Студия 3D печати в СПб. Расчет стоимости онлайн, быстрое изготовление, доставка по всей России.",
    siteName: "Reality3D",
    images: [
      {
        url: '/og-image.jpg', // Need to create this image or use logo
        width: 1200,
        height: 630,
        alt: 'Reality3D Studio',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    yandex: 'yandex-verification-code', // Placeholder
    google: 'google-verification-code', // Placeholder
  },
};

import { ChatProvider } from "@/app/components/chat/chat-provider";
import { ChatWidget } from "@/app/components/chat/chat-widget";
import { PortfolioProvider } from "@/app/context/portfolio-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSession } from "@/lib/session";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-black text-slate-200 flex flex-col")}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
  const storageKey = 'theme';
  const doc = document.documentElement;
  const saved = localStorage.getItem(storageKey);
  const theme = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  doc.classList.toggle('dark', isDark);
  doc.dataset.theme = theme;
})();`}
        </Script>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-primary"
        >
          Перейти к содержимому
        </a>
        <PortfolioProvider>
          <ChatProvider initialRole={session?.role}>
            <SiteHeader user={session as any} />

            <main id="main" className="flex-1">{children}</main>

            <SiteFooter />
            <ChatWidget />
          </ChatProvider>
        </PortfolioProvider>
      </body>
    </html>
  );
}
