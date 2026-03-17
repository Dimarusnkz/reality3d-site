import React from "react";
import { getSession } from "@/lib/session";
import AdminSidebar from "./admin-sidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || !session.userId) {
    redirect('/login');
  }

  // Ensure only employees can access
  const allowedRoles = ['admin', 'manager', 'engineer', 'warehouse', 'delivery', 'accountant'];
  if (!allowedRoles.includes(session.role)) {
    redirect('/lk');
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <AdminSidebar user={session} />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen bg-black">
         <div className="container mx-auto p-6 md:p-8">
            {children}
         </div>
      </main>
    </div>
  );
}
