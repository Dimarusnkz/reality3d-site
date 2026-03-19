import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, DollarSign, CreditCard, Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { formatRub } from "@/lib/shop/money";
import { getMskDayKeyFromDate, getMskDayRangeUtc } from "@/lib/time-msk";
import { ServerMetricsPanel } from "./server-metrics-panel";
import { cn } from "@/lib/utils";
import { getShopOrderStatusMeta, getShopPaymentStatusMeta } from "@/lib/shop/order-status";

import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";

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
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Панель управления</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Reality3D Global Metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/admin/warehouse" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            Склад
          </LinkButton>
          <LinkButton href="/admin/finance" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            Касса
          </LinkButton>
          <LinkButton href="/admin/shop/orders" variant="primary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            Заказы
          </LinkButton>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="h-12 w-12 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-white mb-1 tracking-tighter">{ordersToday}</div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Заказов сегодня (МСК)</p>
          </div>
        </div>

        <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="h-12 w-12 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-white mb-1 tracking-tighter">{canSeeFinance ? formatRub(revenueWeek) : "—"}</div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Выручка за 7 дней</p>
          </div>
        </div>

        <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard className="h-12 w-12 text-purple-500" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-white mb-1 tracking-tighter">{paidOrdersToday}</div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Оплачено сегодня</p>
          </div>
        </div>

        <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-12 w-12 text-orange-500" />
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-white mb-1 tracking-tighter">{customersCount}</div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Клиентов в базе</p>
          </div>
        </div>
      </div>

      {session.role === "admin" ? (
        <div className="neon-card rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/20">
          <ServerMetricsPanel />
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 neon-card border border-slate-800/50 bg-slate-900/30 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-950/30">
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Последние заказы</h3>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Неделя: {ordersWeek}</div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar divide-y divide-slate-800/30">
            {recentShopOrders.length === 0 ? (
              <div className="p-10 text-center text-gray-600 font-bold uppercase tracking-widest text-xs italic">Нет заказов</div>
            ) : (
              recentShopOrders.map((o) => {
                const statusMeta = getShopOrderStatusMeta(o.status);
                const payMeta = getShopPaymentStatusMeta(o.paymentStatus);
                return (
                <Link
                  key={o.id}
                  href={`/admin/shop/orders`}
                  className="block p-5 hover:bg-primary/[0.02] transition-colors group"
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-black text-gray-400 group-hover:text-primary transition-colors shrink-0 shadow-inner">
                        #{o.orderNo}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-base group-hover:text-primary transition-colors truncate">{o.contactName || "Заказ"}</div>
                        <div className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tight">{new Date(o.createdAt).toLocaleString("ru-RU")}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-white text-lg tracking-tight">{formatRub(o.totalKopeks)}</div>
                      <div className="flex flex-wrap justify-end gap-1.5 mt-2">
                        <Badge variant={o.paymentStatus === "paid" ? "success" : "warning"} className="px-1.5 py-0">
                          {payMeta.label}
                        </Badge>
                        <Badge variant={o.status === "completed" ? "secondary" : o.status === "cancelled" ? "error" : "info"} className="px-1.5 py-0">
                          {statusMeta.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
                );
              })
            )}
          </div>
          <div className="p-4 bg-slate-950/30 border-t border-slate-800/50 text-center">
             <Link href="/admin/shop/orders" className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-[0.2em]">Смотреть все заказы</Link>
          </div>
        </div>

        <div className="neon-card border border-slate-800/50 bg-slate-900/30 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-950/30">
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Касса</h3>
            <LinkButton href="/admin/finance" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[9px] h-7 px-3">
              Открыть
            </LinkButton>
          </div>
          {!canSeeFinance ? (
            <div className="p-10 text-center text-gray-600 font-bold uppercase tracking-widest text-xs italic">Нет доступа</div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar p-6 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-inner group">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Выручка сегодня</div>
                <div className="text-white font-black text-2xl tracking-tight">{formatRub(revenueToday)}</div>
              </div>
              <div className="space-y-3">
                {recentCashEntries.map((e) => (
                  <div key={e.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/30 hover:border-slate-700 transition-colors group/entry">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest truncate">{e.account.name}</div>
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">{new Date(e.createdAt).toLocaleDateString("ru-RU")}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold text-white group-hover/entry:text-primary transition-colors truncate">{e.entryType}</div>
                      <div className="text-sm font-black text-white">{formatRub(e.amountKopeks)}</div>
                    </div>
                    {e.description ? <div className="text-[10px] text-gray-500 mt-2 italic truncate opacity-60">{e.description}</div> : null}
                  </div>
                ))}
                {recentCashEntries.length === 0 ? <div className="p-10 text-center text-gray-600 font-bold uppercase tracking-widest text-xs italic">Нет операций</div> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
