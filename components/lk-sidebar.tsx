"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Calculator, 
  FileBox, 
  Settings, 
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { CsrfTokenField } from "@/components/ui/csrf-token-field";

const NAV_ITEMS = [
  { href: "/lk", label: "Дашборд", icon: LayoutDashboard },
  { href: "/lk/orders", label: "Мои заказы", icon: Package },
  { href: "/lk/calculations", label: "Мои расчеты", icon: Calculator },
  { href: "/lk/files", label: "Мои файлы", icon: FileBox },
  { href: "/lk/settings", label: "Настройки", icon: Settings },
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

type LkSidebarUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

export function LkSidebar({ user }: { user: LkSidebarUser }) {
  const pathname = usePathname();
  const roleLabel = ROLE_LABELS[user.role as string] || 'Клиент';

  const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'U';

  return (
      <aside className="w-64 border-r border-slate-800 bg-slate-950/50 hidden md:flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center justify-center w-full">
             <span className="text-lg font-bold text-primary border border-primary/50 bg-primary/10 px-4 py-2 rounded-lg uppercase w-full text-center shadow-[0_0_15px_rgba(255,94,0,0.2)]">{roleLabel}</span>
          </Link>
        </div>
        
        <div className="p-4 flex-1 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                pathname === item.href 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(255,94,0,0.1)]" 
                  : "text-gray-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-6 px-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold border border-slate-700">
                {initials}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold text-white truncate">{user.name || 'Пользователь'}</p>
                 <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
           </div>
           
           <form action={logout} className="w-full">
             <CsrfTokenField />
             <button
               type="submit"
               className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 w-full transition-colors"
             >
               <LogOut className="h-5 w-5" />
               Выйти
             </button>
           </form>
        </div>
      </aside>
  );
}
