import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminSecurityPage() {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    redirect("/login");
  }

  const prisma = getPrisma();

  const events = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { id: true, email: true, role: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Безопасность</h1>
        <p className="text-gray-400 mt-2">Аудит входов, выходов и действий управления сессиями.</p>
      </div>

      <div className="neon-card p-6 rounded-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Журнал аудита</h2>
          <div className="text-xs text-gray-500">Последние {events.length} событий</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-slate-800">
                <th className="py-3 pr-4 font-medium">Время</th>
                <th className="py-3 pr-4 font-medium">Актор</th>
                <th className="py-3 pr-4 font-medium">Действие</th>
                <th className="py-3 pr-4 font-medium">Цель</th>
                <th className="py-3 pr-4 font-medium">Детали</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-slate-900/60">
                  <td className="py-3 pr-4 text-gray-300 whitespace-nowrap">{e.createdAt.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-gray-300">
                    <div className="flex flex-col">
                      <span className="text-white">{e.actor?.email || "—"}</span>
                      <span className="text-xs text-gray-500">{e.actor?.role || "anon"}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-200">{e.action}</td>
                  <td className="py-3 pr-4 text-gray-400 max-w-[420px] truncate">{e.target || "—"}</td>
                  <td className="py-3 pr-4 text-gray-500 max-w-[520px] truncate">
                    {e.metadata || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

