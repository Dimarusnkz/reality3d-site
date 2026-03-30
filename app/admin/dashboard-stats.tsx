import { ShoppingBag, DollarSign, Users } from "lucide-react";
import { getPrisma } from "@/lib/prisma";
import { getMskDayKeyFromDate, getMskDayRangeUtc } from "@/lib/time-msk";
import { formatRub } from "@/lib/shop/money";

export async function DashboardStats() {
  const prisma = getPrisma();
  const todayKey = getMskDayKeyFromDate(new Date());
  const todayRange = getMskDayRangeUtc(todayKey);
  if (!todayRange) return null;

  const weekStart = new Date(todayRange.start.getTime() - 6 * 24 * 60 * 60 * 1000);
  const weekRange = { start: weekStart, end: todayRange.end };

  const [
    ordersToday,
    paidOrdersToday,
    revenueTodayAgg,
    revenueWeekAgg,
    customersCount,
  ] = await Promise.all([
    prisma.shopOrder.count({ where: { createdAt: { gte: todayRange.start, lt: todayRange.end } } }),
    prisma.shopOrder.count({ where: { paymentStatus: "paid", createdAt: { gte: todayRange.start, lt: todayRange.end } } }),
    prisma.cashEntry.aggregate({
      where: { direction: "income", entryType: "order_payment", createdAt: { gte: todayRange.start, lt: todayRange.end } },
      _sum: { amountKopeks: true },
    }),
    prisma.cashEntry.aggregate({
      where: { direction: "income", entryType: "order_payment", createdAt: { gte: weekRange.start, lt: weekRange.end } },
      _sum: { amountKopeks: true },
    }),
    prisma.user.count({ where: { role: { in: ["user", "client"] } } }),
  ]);

  const revenueToday = revenueTodayAgg._sum.amountKopeks ?? 0;
  const revenueWeek = revenueWeekAgg._sum.amountKopeks ?? 0;

  return (
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
          <DollarSign className="h-12 w-12 text-green-500" />
        </div>
        <div className="relative z-10">
          <div className="text-3xl font-black text-white mb-1 tracking-tighter">{formatRub(revenueToday)}</div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Выручка сегодня</p>
        </div>
      </div>

      <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <DollarSign className="h-12 w-12 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="text-3xl font-black text-white mb-1 tracking-tighter">{formatRub(revenueWeek)}</div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Выручка за неделю</p>
        </div>
      </div>

      <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Users className="h-12 w-12 text-purple-500" />
        </div>
        <div className="relative z-10">
          <div className="text-3xl font-black text-white mb-1 tracking-tighter">{customersCount}</div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Всего клиентов</p>
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="neon-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse">
          <div className="h-8 w-24 bg-slate-800 rounded mb-2"></div>
          <div className="h-3 w-32 bg-slate-800 rounded"></div>
        </div>
      ))}
    </div>
  );
}
