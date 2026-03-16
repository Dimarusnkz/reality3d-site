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
  Settings, 
  BarChart3,
  LogOut,
  Shield,
  ShieldCheck,
  MessageSquare,
  Send,
  Star,
  Box
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { CsrfTokenField } from "@/components/ui/csrf-token-field";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, roles: ['admin', 'manager', 'engineer', 'warehouse', 'delivery'] },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingBag, roles: ['admin', 'manager', 'engineer', 'warehouse', 'delivery'] },
  { href: "/admin/chat", label: "Чат с клиентами", icon: MessageSquare, roles: ['admin', 'manager', 'engineer', 'warehouse', 'delivery'] },
  { href: "/admin/clients", label: "Клиенты", icon: Users, roles: ['admin', 'manager'] },
  { href: "/admin/reviews", label: "Отзывы", icon: Star, roles: ['admin', 'manager'] },
  { href: "/admin/security", label: "Безопасность", icon: ShieldCheck, roles: ['admin'] },
  { href: "/admin/team", label: "Сотрудники", icon: Shield, roles: ['admin'] },
  { href: "/admin/content", label: "Контент", icon: FileText, roles: ['admin', 'manager'] },
  { href: "/admin/blog", label: "Блог", icon: PenTool, roles: ['admin', 'manager'] },
  { href: "/admin/portfolio", label: "Портфолио", icon: ImageIcon, roles: ['admin', 'manager'] },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3, roles: ['admin'] },
  { href: "/admin/telegram", label: "Телеграм", icon: Send, roles: ['admin', 'manager'] },
  { href: "/admin/max", label: "MAX", icon: Box, roles: ['admin', 'manager'] },
  { href: "/admin/settings", label: "Настройки", icon: Settings, roles: ['admin', 'manager', 'engineer', 'warehouse', 'delivery'] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  engineer: 'Инженер',
  warehouse: 'Склад',
  delivery: 'Доставка',
  user: 'Клиент',
  client: 'Клиент'
};

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const roleLabel = ROLE_LABELS[user.role as string] || user.role;

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 hidden md:flex flex-col fixed h-full z-40">
      <div className="p-6 border-b border-slate-800 bg-red-950/10">
        <Link href="/admin" className="flex items-center justify-center w-full">
           <span className="text-lg font-bold bg-red-600 text-white px-4 py-2 rounded-lg uppercase w-full text-center shadow-lg shadow-red-900/20">{roleLabel}</span>
        </Link>
      </div>
      
      <div className="p-4 flex-1 space-y-1 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          if (!item.roles.includes(user.role)) return null;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === item.href 
                  ? "bg-slate-800 text-white shadow-md" 
                  : "text-gray-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
         <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center text-red-500 font-bold border border-red-900">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
               <p className="text-sm font-bold text-white truncate">{user.name || 'User'}</p>
               <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
            </div>
         </div>
         
         <form action={logout} className="w-full">
           <CsrfTokenField />
           <button
             type="submit"
             className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-slate-800 w-full transition-colors"
           >
             <LogOut className="h-4 w-4" />
             Выйти из панели
           </button>
         </form>
      </div>
    </aside>
  );
}
