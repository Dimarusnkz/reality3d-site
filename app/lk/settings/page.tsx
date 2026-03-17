import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { SessionsCard } from "./sessions-card";

export default async function LkSettingsPage() {
  const session = await getSession();
  const prisma = getPrisma();
  const user = session?.userId
    ? await prisma.user.findUnique({
        where: { id: parseInt(session.userId) },
        select: { id: true, name: true, email: true, phone: true, address: true },
      })
    : null;

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Настройки профиля</h1>
      <div className="neon-card p-6 rounded-xl max-w-2xl">
        <ProfileForm user={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address || null
        }} />
      </div>

      <SessionsCard
        currentSessionId={session?.sessionId || ""}
        sessions={(
          await prisma.session.findMany({
            where: { userId: user.id },
            orderBy: { lastUsedAt: 'desc' },
            select: { id: true, createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true, userAgent: true },
          })
        ).map((s) => ({
          id: s.id,
          createdAt: s.createdAt.toISOString(),
          lastUsedAt: s.lastUsedAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
          userAgent: s.userAgent,
        }))}
      />
    </div>
  );
}
