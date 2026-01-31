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
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/admin/chat", label: "Чат с клиентами", icon: MessageSquare },
  { href: "/admin/clients", label: "Клиенты", icon: Users },
  { href: "/admin/team", label: "Сотрудники", icon: Shield },
  { href: "/admin/content", label: "Контент", icon: FileText },
  { href: "/admin/blog", label: "Блог", icon: PenTool },
  { href: "/admin/portfolio", label: "Портфолио", icon: ImageIcon },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 hidden md:flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-slate-800 bg-red-950/10">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
             <span className="text-white">Reality</span>3D
             <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded ml-1">ADMIN</span>
          </Link>
        </div>
        
        <div className="p-4 flex-1 space-y-1 overflow-y-auto">
          {ADMIN_NAV_ITEMS.map((item) => (
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
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center text-red-500 font-bold border border-red-900">
                A
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold text-white truncate">Administrator</p>
                 <p className="text-xs text-gray-500 truncate">Super Admin</p>
              </div>
           </div>
           
           <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-slate-800 w-full transition-colors">
             <LogOut className="h-4 w-4" />
             Выйти из панели
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen bg-black">
         <div className="container mx-auto p-6 md:p-8">
            {children}
         </div>
      </main>
    </div>
  );
}
