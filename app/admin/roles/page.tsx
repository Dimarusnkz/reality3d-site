import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { RolesClient } from "./roles-client";

export default async function AdminRolesPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "roles.manage");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const [users, groups, permissions] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accessGroups: { select: { group: { select: { id: true, name: true } } } },
        accessPermissions: { select: { permissionKey: true, allow: true } },
      },
      orderBy: { id: "asc" },
      take: 500,
    }),
    prisma.accessGroup.findMany({ 
      select: { 
        id: true, 
        name: true, 
        description: true,
        permissions: { select: { permissionKey: true } }
      }, 
      orderBy: { name: "asc" }, 
      take: 500 
    }),
    prisma.permission.findMany({ select: { key: true, description: true }, orderBy: { key: "asc" }, take: 500 }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Роли и права</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Access Control & Permission Management</p>
        </div>
      </div>

      <RolesClient
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          groups: u.accessGroups.map((g) => ({ id: g.group.id, name: g.group.name })),
          overrides: u.accessPermissions.map(p => ({ key: p.permissionKey, allow: p.allow })),
        }))}
        groups={groups.map(g => ({
          ...g,
          permissions: g.permissions.map(p => p.permissionKey)
        }))}
        permissions={permissions}
      />
    </div>
  );
}

