import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, DollarSign, CreditCard, Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { formatRub } from "@/lib/shop/money";
import { getMskDayKeyFromDate, getMskDayRangeUtc } from "@/lib/time-msk";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const userId = parseInt(session.userId, 10);
  const prisma = getPrisma();

  const todayKey = getMskDayKeyFromDate(new Date());
  const todayRange = getMskDayRangeUtc(todayKey);
  if (!todayRange) redirect("/admin");

  const weekStart = new Date(todayRange.start.getTime() - 6 * 24 * 60 * 60 * 1000);
  const weekRange = { start: weekStart, end: todayRange.end };

  const canSeeFinance = await hasPermission(userId, session.role, "finance.view");

  const [
    ordersToday,
    paidOrdersToday,
    ordersWeek,
    revenueTodayAgg,
    revenueWeekAgg,
    recentShopOrders,
    recentCashEntries,
    customersCount,
  ] = await Promise.all([
    prisma.shopOrder.count({ where: { createdAt: { gte: todayRange.start, lt: todayRange.end } } }),
    prisma.shopOrder.count({ where: { paymentStatus: "paid", createdAt: { gte: todayRange.start, lt: todayRange.end } } }),
    prisma.shopOrder.count({ where: { createdAt: { gte: weekRange.start, lt: weekRange.end } } }),
    prisma.cashEntry.aggregate({
      where: { direction: "income", entryType: "order_payment", createdAt: { gte: todayRange.start, lt: todayRange.end } },
      _sum: { amountKopeks: true },
    }),
    prisma.cashEntry.aggregate({
      where: { direction: "income", entryType: "order_payment", createdAt: { gte: weekRange.start, lt: weekRange.end } },
      _sum: { amountKopeks: true },
    }),
    prisma.shopOrder.findMany({
      select: { id: true, orderNo: true, totalKopeks: true, status: true, paymentStatus: true, createdAt: true, contactName: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.cashEntry.findMany({
      select: { id: true, createdAt: true, direction: true, entryType: true, amountKopeks: true, description: true, account: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.user.count({ where: { role: { in: ["user", "client"] } } }),
  ]);

  const revenueToday = revenueTodayAgg._sum.amountKopeks ?? 0;
  const revenueWeek = revenueWeekAgg._sum.amountKopeks ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Панель управления</h1>
          <p className="text-gray-400">Ключевые показатели магазина</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href="/admin/finance" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Касса
          </Link>
          <Link href="/admin/shop/orders" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Заказы
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingBag className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{ordersToday}</div>
          <p className="text-sm text-gray-400">Заказов сегодня (МСК)</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{canSeeFinance ? formatRub(revenueWeek) : "—"}</div>
          <p className="text-sm text-gray-400">Выручка за 7 дней</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{paidOrdersToday}</div>
          <p className="text-sm text-gray-400">Оплачено сегодня</p>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{customersCount}</div>
          <p className="text-sm text-gray-400">Клиентов в базе</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-slate-800 bg-slate-900/30 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-white">Последние заказы магазина</h3>
            <div className="text-sm text-gray-500">Неделя: {ordersWeek}</div>
          </div>
          <div className="space-y-3">
            {recentShopOrders.length === 0 ? (
              <div className="text-gray-500 text-sm">Нет заказов</div>
            ) : (
              recentShopOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/shop/orders`}
                  className="block p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
                        #{o.orderNo}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{o.contactName || "Заказ"}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{new Date(o.createdAt).toLocaleString("ru-RU")}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-white">{formatRub(o.totalKopeks)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {o.paymentStatus} / {o.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-white">Касса</h3>
            <Link href="/admin/finance" className="text-sm text-primary hover:underline">
              Открыть
            </Link>
          </div>
          {!canSeeFinance ? (
            <div className="text-gray-500 text-sm">Нет доступа к финансовым данным</div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="text-gray-400 text-sm">Выручка сегодня</div>
                <div className="text-white font-bold text-xl mt-1">{formatRub(revenueToday)}</div>
              </div>
              {recentCashEntries.map((e) => (
                <div key={e.id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">{e.account.name}</div>
                    <div className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString("ru-RU")}</div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <div className="text-white text-sm truncate">{e.entryType}</div>
                    <div className="text-white font-semibold">{formatRub(e.amountKopeks)}</div>
                  </div>
                  {e.description ? <div className="text-xs text-gray-500 mt-1 truncate">{e.description}</div> : null}
                </div>
              ))}
              {recentCashEntries.length === 0 ? <div className="text-gray-500 text-sm">Нет операций</div> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
