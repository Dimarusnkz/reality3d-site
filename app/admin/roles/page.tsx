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
      },
      orderBy: { id: "asc" },
      take: 500,
    }),
    prisma.accessGroup.findMany({ select: { id: true, name: true, description: true }, orderBy: { name: "asc" }, take: 500 }),
    prisma.permission.findMany({ select: { key: true, description: true }, orderBy: { key: "asc" }, take: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Роли и права</h1>
      <RolesClient
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          groups: u.accessGroups.map((g) => ({ id: g.group.id, name: g.group.name })),
        }))}
        groups={groups}
        permissions={permissions}
      />
    </div>
  );
}

