"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { href: "/services", label: "Услуги" },
    { href: "/portfolio", label: "Портфолио" },
    { href: "/equipment", label: "Оборудование" },
    { href: "/materials", label: "Материалы" },
    { href: "/calculator", label: "Калькулятор" },
  ];

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

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            href="/login"
          >
            Войти
          </Link>
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
              <Link
                href="/login"
                className="text-lg font-medium text-gray-200 hover:text-primary transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Войти
              </Link>
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
