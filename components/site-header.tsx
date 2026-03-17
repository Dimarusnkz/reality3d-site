"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, User, LogOut, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/app/actions/auth";
import { CsrfTokenField } from "@/components/ui/csrf-token-field";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface SiteHeaderProps {
  user?: {
    userId: string;
    role: string;
  } | null;
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { href: "/services", label: "Услуги" },
    { href: "/shop", label: "Магазин" },
    { href: "/portfolio", label: "Портфолио" },
    { href: "/blog", label: "Блог" },
    { href: "/materials", label: "Материалы" },
    { href: "/reviews", label: "Отзывы" },
  ];

  const isAdminRole = user?.role && ['admin', 'manager', 'engineer', 'warehouse', 'delivery'].includes(user.role);
  
  const dashboardLabel = user?.role === 'admin' 
    ? 'Админ-панель' 
    : (user?.role && ['manager', 'engineer', 'warehouse', 'delivery'].includes(user.role) 
      ? 'Сотрудник' 
      : 'Кабинет');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          className="flex items-center gap-2 font-bold text-2xl tracking-tighter" 
          href="/"
          onClick={() => setIsOpen(false)}
        >
          <span className="text-primary text-glow">Reality</span>3D
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          {menuItems.map((item) => (
            <Link 
              key={item.href}
              className="hover:text-primary transition-colors" 
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Social Icons */}
        <div className="hidden md:flex items-center gap-3 border-r border-slate-800 pr-4 mr-4">
           {/* Telegram */}
           <a href="https://t.me/Reality_3Dtg" target="_blank" rel="noopener noreferrer" className="bg-[#2AABEE] text-white w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_10px_rgba(42,171,238,0.4)]" title="Telegram">
              <Send className="w-4 h-4" />
           </a>
           {/* Max (Custom Logo) */}
           <a href="https://max.ru/join/4YSX3vkvUjYNPAqayBmTLJuEmr0pBy65drrrrOOm6qg" target="_blank" rel="noopener noreferrer" className="relative w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform shadow-[0_0_10px_rgba(147,51,234,0.4)]" title="Max">
              <img src="/max-logo.png" alt="Max" className="w-full h-full object-cover" />
           </a>
           {/* VK */}
           <a href="https://vk.com/Reality3DSPB" target="_blank" rel="noopener noreferrer" className="relative w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform shadow-[0_0_10px_rgba(0,119,255,0.4)]" title="VK">
              <img src="/vk-logo.png" alt="VK" className="w-full h-full object-cover" />
           </a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {dashboardLabel}
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden"
                  >
                    <Link
                      href={isAdminRole ? "/admin" : "/lk"}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-800 hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {dashboardLabel}
                    </Link>
                    <form
                      action={logout}
                      onSubmit={() => setIsUserMenuOpen(false)}
                      className="w-full"
                    >
                      <CsrfTokenField />
                      <button
                        type="submit"
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-800 hover:text-red-400 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Выход
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              href="/login"
            >
              Войти
            </Link>
          )}
          <Link
            className="h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_rgba(255,94,0,0.5)] flex"
            href="/calculator"
          >
            Рассчитать стоимость
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-white hover:text-primary transition-colors"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-800 bg-black/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Тема</div>
                <ThemeToggle />
              </div>
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-lg font-medium text-gray-200 hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="border-slate-800 my-2" />
              {user ? (
                <>
                  <Link
                    href={isAdminRole ? "/admin" : "/lk"}
                    className="text-lg font-medium text-gray-200 hover:text-primary transition-colors py-2 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    {dashboardLabel}
                  </Link>
                  <form action={logout} onSubmit={() => setIsOpen(false)} className="w-full">
                    <CsrfTokenField />
                    <button
                      type="submit"
                      className="w-full text-left text-lg font-medium text-red-500 hover:text-red-400 transition-colors py-2 flex items-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Выход
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-lg font-medium text-gray-200 hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Войти
                </Link>
              )}
              <Link
                href="/calculator"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-bold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all"
                onClick={() => setIsOpen(false)}
              >
                Рассчитать стоимость
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
