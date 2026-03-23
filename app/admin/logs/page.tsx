import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { getAuditActionLabel, getClientLogActionLabel, getWarehouseLogActionLabel } from "@/lib/logs/action-labels";

type SearchParams = {
  type?: string;
  action?: string;
  role?: string;
  q?: string;
  from?: string;
  to?: string;
};

function parseDate(value: string | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default async function AdminLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "logs.view");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const sp = await searchParams;
  const type = (sp.type || "all").toLowerCase();
  const action = (sp.action || "").trim();
  const role = (sp.role || "").trim();
  const q = (sp.q || "").trim();
  const from = parseDate(sp.from);
  const to = parseDate(sp.to);

  const whereTime = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };

  const auditCategoryPrefix =
    type === "finance"
      ? "finance."
      : type === "shop"
        ? "shop."
        : type === "roles"
          ? null
          : type === "staff"
            ? "orders."
            : type === "security"
              ? "sessions."
              : null;

  const [warehouse, client, audit] = await Promise.all([
    type === "client" || type === "finance" || type === "shop" || type === "roles" || type === "staff" || type === "security"
      ? Promise.resolve([])
      : prisma.shopWarehouseLog.findMany({
          where: {
            ...(Object.keys(whereTime).length ? { createdAt: whereTime } : {}),
            ...(action ? { actionType: action } : {}),
            ...(role ? { actorRole: role } : {}),
            ...(q
              ? {
                  OR: [
                    { sku: { contains: q, mode: "insensitive" } },
                    { productName: { contains: q, mode: "insensitive" } },
                    { comment: { contains: q, mode: "insensitive" } },
                    { supplier: { contains: q, mode: "insensitive" } },
                    { documentNo: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
    type === "warehouse" || type === "finance" || type === "shop" || type === "roles" || type === "staff" || type === "security"
      ? Promise.resolve([])
      : prisma.shopClientLog.findMany({
          where: {
            ...(Object.keys(whereTime).length ? { createdAt: whereTime } : {}),
            ...(action ? { actionType: action } : {}),
            ...(q
              ? {
                  OR: [{ message: { contains: q, mode: "insensitive" } }],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
    type === "warehouse" || type === "client"
      ? Promise.resolve([])
      : prisma.auditEvent.findMany({
          where: {
            ...(Object.keys(whereTime).length ? { createdAt: whereTime } : {}),
            ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
            ...(role ? { actor: { is: { role } } } : {}),
            ...(type === "roles"
              ? {
                  OR: [
                    { action: { startsWith: "access." } },
                    { action: { startsWith: "roles." } },
                  ],
                }
              : auditCategoryPrefix
                ? { action: { startsWith: auditCategoryPrefix } }
                : {}),
            ...(q
              ? {
                  OR: [
                    { action: { contains: q, mode: "insensitive" } },
                    { target: { contains: q, mode: "insensitive" } },
                    { metadata: { contains: q, mode: "insensitive" } },
                    { actor: { is: { email: { contains: q, mode: "insensitive" } } } },
                  ],
                }
              : {}),
          },
          include: { actor: { select: { id: true, email: true, role: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
  ]);

  const rows = [
    ...warehouse.map((l) => ({
      kind: "warehouse" as const,
      createdAt: l.createdAt,
      user: l.actorRole ? `${l.actorRole}` : "—",
      action: l.actionType,
      target: l.sku || l.productName || "—",
      delta: `${l.quantityDelta.toString()} ${l.unit}`,
      note: l.reason || l.comment || l.supplier || "",
    })),
    ...client.map((l) => ({
      kind: "client" as const,
      createdAt: l.createdAt,
      user: l.userId ? `Клиент #${l.userId}` : "Гость",
      action: l.actionType,
      target: l.productId ? `Товар #${l.productId}` : l.shopOrderId ? `Заказ ${l.shopOrderId}` : "—",
      delta: l.quantity ? `${l.quantity.toString()} ${l.unit || ""}`.trim() : "",
      note: l.message || l.orderStatus || "",
    })),
    ...audit.map((e) => ({
      kind: "audit" as const,
      createdAt: e.createdAt,
      user: e.actor ? `${e.actor.name || e.actor.email} (${e.actor.role})` : "Система",
      action: e.action,
      target: e.target || "—",
      delta: "",
      note: e.metadata || "",
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const exportParams = new URLSearchParams();
  exportParams.set("type", type);
  if (action) exportParams.set("action", action);
  if (role) exportParams.set("role", role);
  if (q) exportParams.set("q", q);
  if (sp.from) exportParams.set("from", sp.from);
  if (sp.to) exportParams.set("to", sp.to);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Логи</h1>
        <Link
          href={`/api/admin/logs/export?${exportParams.toString()}`}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Экспорт CSV
        </Link>
      </div>

      <form className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-6 gap-4" action="/admin/logs">
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Тип</label>
          <select
            name="type"
            defaultValue={type}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">Все</option>
            <option value="warehouse">Склад</option>
            <option value="client">Клиенты</option>
            <option value="staff">Сотрудники</option>
            <option value="finance">Касса</option>
            <option value="shop">Магазин</option>
            <option value="roles">Роли</option>
            <option value="security">Безопасность</option>
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Действие</label>
          <input name="action" defaultValue={action} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Роль</label>
          <input name="role" defaultValue={role} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">С</label>
          <input name="from" defaultValue={sp.from || ""} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" placeholder="2025-04-05" />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">По</label>
          <input name="to" defaultValue={sp.to || ""} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" placeholder="2025-04-05" />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs text-gray-400 mb-1">Поиск</label>
          <input name="q" defaultValue={q} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" placeholder="брак, ТБанк..." />
        </div>
        <button className="md:col-span-6 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
          Применить
        </button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Время</th>
              <th className="p-4 text-left font-medium">Кто</th>
              <th className="p-4 text-left font-medium">Действие</th>
              <th className="p-4 text-left font-medium">Товар/Заказ</th>
              <th className="p-4 text-left font-medium">Кол-во</th>
              <th className="p-4 text-left font-medium">Комментарий</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((r, idx) => (
              <tr
                key={idx}
                className={
                  r.kind === "warehouse"
                    ? "bg-blue-500/5"
                    : r.kind === "client"
                      ? "bg-green-500/5"
                      : "bg-purple-500/5"
                }
              >
                <td className="p-4 text-gray-300">{r.createdAt.toLocaleString("ru-RU")}</td>
                <td className="p-4 text-white">{r.user}</td>
                <td className="p-4">
                  <div className="text-gray-200">
                    {r.kind === "warehouse"
                      ? getWarehouseLogActionLabel(r.action)
                      : r.kind === "client"
                        ? getClientLogActionLabel(r.action)
                        : getAuditActionLabel(r.action)}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{r.action}</div>
                </td>
                <td className="p-4 text-gray-300">{r.target}</td>
                <td className="p-4 text-gray-300">{r.delta}</td>
                <td className="p-4 text-gray-400">
                  {r.note && r.note.length > 220 ? `${r.note.slice(0, 220)}…` : r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="p-8 text-center text-gray-500">Нет записей</div> : null}
      </div>
    </div>
  );
}
