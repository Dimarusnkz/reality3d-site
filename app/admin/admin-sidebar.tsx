"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  FileText, 
  PenTool, 
  Image as ImageIcon, 
  LogOut,
  Shield,
  ShieldCheck,
  MessageSquare,
  Send,
  Star,
  Box,
  Database,
  Wallet,
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { CsrfTokenField } from "@/components/ui/csrf-token-field";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, roles: ['admin', 'manager', 'engineer', 'warehouse', 'delivery', 'accountant'] },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingBag, roles: ['admin', 'manager', 'engineer', 'warehouse', 'delivery', 'accountant'] },
  { href: "/admin/shop", label: "Магазин", icon: Box, roles: ['admin', 'manager'] },
  { href: "/admin/warehouse", label: "Склад", icon: Database, roles: ['admin', 'manager', 'warehouse', 'engineer', 'accountant'] },
  { href: "/admin/logs", label: "Логи", icon: FileText, roles: ['admin', 'manager', 'accountant'] },
  { href: "/admin/finance", label: "Касса", icon: Wallet, roles: ['admin', 'manager', 'accountant'] },
  { href: "/admin/roles", label: "Роли", icon: KeyRound, roles: ['admin'] },
  { href: "/admin/chat", label: "Чат с клиентами", icon: MessageSquare, roles: ['admin', 'manager', 'engineer', 'warehouse', 'delivery'] },
  { href: "/admin/clients", label: "Клиенты", icon: Users, roles: ['admin', 'manager'] },
  { href: "/admin/reviews", label: "Отзывы", icon: Star, roles: ['admin', 'manager'] },
  { href: "/admin/security", label: "Безопасность", icon: ShieldCheck, roles: ['admin'] },
  { href: "/admin/team", label: "Сотрудники", icon: Shield, roles: ['admin'] },
  { href: "/admin/blog", label: "Блог", icon: PenTool, roles: ['admin', 'manager'] },
  { href: "/admin/portfolio", label: "Портфолио", icon: ImageIcon, roles: ['admin', 'manager'] },
  { href: "/admin/databases", label: "Базы данных", icon: Database, roles: ['admin'] },
  { href: "/admin/telegram", label: "Телеграм", icon: Send, roles: ['admin', 'manager'] },
  { href: "/admin/max", label: "MAX", icon: Box, roles: ['admin', 'manager'] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  engineer: 'Инженер',
  warehouse: 'Склад',
  delivery: 'Доставка',
  accountant: 'Бухгалтер',
  user: 'Клиент',
  client: 'Клиент'
};

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const roleLabel = ROLE_LABELS[user.role as string] || user.role;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 hidden md:flex flex-col fixed h-full z-40 shadow-2xl">
      <div className="p-6 border-b border-slate-800/50 bg-slate-900/20">
        <Link href="/admin" className="flex flex-col items-center justify-center w-full gap-3">
           <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
             <ShieldCheck className="w-6 h-6 text-red-600" />
           </div>
           <span className="text-xs font-black text-white px-3 py-1 rounded-full bg-red-600 uppercase shadow-lg shadow-red-900/40 tracking-[0.2em]">
             {roleLabel}
           </span>
        </Link>
      </div>
      
      <div className="p-4 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {ADMIN_NAV_ITEMS.map((item) => {
          if (!item.roles.includes(user.role)) return null;
          
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 group",
                isActive 
                  ? "bg-slate-900 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] border border-slate-800" 
                  : "text-gray-500 hover:text-white hover:bg-slate-900/50"
              )}
            >
              <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary shadow-primary" : "text-gray-600 group-hover:text-gray-300")} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(255,94,0,0.8)]"></div>}
            </Link>
          );
        })}
      </div>

      <div className="p-6 border-t border-slate-800/50 bg-slate-950/50">
         <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-primary font-black border border-slate-800 shadow-inner">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
               <p className="text-sm font-black text-white truncate tracking-tight">{user.name || 'User'}</p>
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest truncate">{user.role}</p>
            </div>
         </div>
         
         <form action={logout} className="w-full">
           <CsrfTokenField />
           <button
             type="submit"
             className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 w-full transition-all duration-300"
           >
             <LogOut className="h-3.5 w-3.5" />
             Выход
           </button>
         </form>
      </div>
    </aside>
  );
}
