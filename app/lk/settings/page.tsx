import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function LkSettingsPage() {
  const session = await getSession();
  const user = session?.userId ? await prisma.user.findUnique({ where: { id: parseInt(session.userId) } }) : null;

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
            address: (user as any).address || null
        }} />
      </div>
    </div>
  );
}
