import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

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
        <form className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Имя</label>
              <input type="text" defaultValue={user.name || ""} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" defaultValue={user.email} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" readOnly />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Телефон</label>
              <input type="tel" defaultValue={user.phone || ""} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Адрес доставки</label>
              <input type="text" defaultValue="" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" placeholder="Не указан" />
           </div>
           <button type="button" className="neon-button">Сохранить</button>
        </form>
      </div>
    </div>
  );
}
