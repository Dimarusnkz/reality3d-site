import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LkSidebar } from "@/components/lk-sidebar";
import { MessageSquare } from "lucide-react";

export default async function LkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.userId) {
     redirect('/login');
  }

  const user = await prisma.user.findUnique({ where: { id: parseInt(session.userId) } });
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <LkSidebar user={user} />

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
