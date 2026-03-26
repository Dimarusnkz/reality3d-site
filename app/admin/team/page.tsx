import { getPrisma } from "@/lib/prisma";
import TeamClient from "./team-client";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminTeamPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    redirect('/admin');
  }

  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where: {
      role: {
        notIn: ['user', 'client']
      }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  return <TeamClient users={users} />;
}
