import React from "react";
import { getSession } from "@/lib/session";
import AdminSidebar from "./admin-sidebar";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";

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

  const userId = parseInt(session.userId, 10);
  const prisma = getPrisma();

  // Fetch all user permissions (from role, groups and individual overrides)
  const [rolePerms, groupPerms, individualPerms] = await Promise.all([
    prisma.rolePermission.findMany({ where: { roleName: session.role }, select: { permissionKey: true } }),
    prisma.userAccessGroup.findMany({ 
      where: { userId }, 
      include: { group: { include: { permissions: { select: { permissionKey: true } } } } } 
    }),
    prisma.userAccessPermission.findMany({ where: { userId }, select: { permissionKey: true, allow: true } })
  ]);

  const permissionsSet = new Set<string>();
  rolePerms.forEach(p => permissionsSet.add(p.permissionKey));
  groupPerms.forEach(ug => ug.group.permissions.forEach(p => permissionsSet.add(p.permissionKey)));
  
  // Overrides: if allow=false, remove from set; if allow=true, add to set
  individualPerms.forEach(p => {
    if (p.allow) permissionsSet.add(p.permissionKey);
    else permissionsSet.delete(p.permissionKey);
  });

  const permissions = Array.from(permissionsSet);

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <AdminSidebar user={session} permissions={permissions} />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen bg-black">
         <div className="container mx-auto p-6 md:p-8">
            {children}
         </div>
      </main>
    </div>
  );
}
