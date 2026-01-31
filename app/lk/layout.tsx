"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Calculator, 
  FileBox, 
  Settings, 
  LogOut, 
  MessageSquare 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/lk", label: "Дашборд", icon: LayoutDashboard },
  { href: "/lk/orders", label: "Мои заказы", icon: Package },
  { href: "/lk/calculations", label: "Мои расчеты", icon: Calculator },
  { href: "/lk/files", label: "Мои файлы", icon: FileBox },
  { href: "/lk/settings", label: "Настройки", icon: Settings },
];

export default function LkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/50 hidden md:flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
             <span className="text-primary text-glow">Reality</span>3D
             <span className="text-xs text-primary border border-primary px-1 rounded ml-1">LK</span>
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
                JD
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold text-white truncate">John Doe</p>
                 <p className="text-xs text-gray-500 truncate">client@example.com</p>
              </div>
           </div>
           
           <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 w-full transition-colors">
             <LogOut className="h-5 w-5" />
             Выйти
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen relative">
         {/* Mobile Header (visible only on small screens) */}
         <div className="md:hidden h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 sticky top-0 z-30">
            <Link href="/" className="font-bold text-xl">
               <span className="text-primary">Reality</span>3D
            </Link>
            {/* Mobile Menu Trigger would go here */}
         </div>

         <div className="container mx-auto p-6 md:p-10">
            {children}
         </div>
      </main>
      
      {/* Chat Widget Placeholder */}
      <div className="fixed bottom-6 right-6 z-50">
         <button className="w-14 h-14 rounded-full bg-primary text-white shadow-[0_0_20px_rgba(255,94,0,0.4)] flex items-center justify-center hover:scale-110 transition-transform hover:shadow-[0_0_30px_rgba(255,94,0,0.6)]">
            <MessageSquare className="h-6 w-6" />
         </button>
      </div>
    </div>
  );
}
