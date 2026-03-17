import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";

export default async function AdminShopReportsPage() {
  const prisma = getPrisma();

  const byProvider = await prisma.shopOrder.groupBy({
    by: ["paymentProvider"],
    where: { paymentStatus: "paid" },
    _sum: { totalKopeks: true },
    _count: { _all: true },
  });

  const pickupCount = await prisma.shopOrder.count({
    where: { shippingMethod: "pickup" },
  });

  const rows = byProvider
    .map((r) => ({
      provider: r.paymentProvider || "—",
      revenue: r._sum.totalKopeks || 0,
      count: r._count._all,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Отчёты</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Самовывоз (кол-во заказов)</div>
          <div className="text-3xl font-bold text-white mt-2">{pickupCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Выручка по способам оплаты (оплаченные)</div>
          <div className="mt-4 space-y-2">
            {rows.length === 0 ? (
              <div className="text-gray-500 text-sm">Пока нет данных</div>
            ) : (
              rows.map((r) => (
                <div key={r.provider} className="flex items-center justify-between gap-4">
                  <div className="text-white">
                    {r.provider} <span className="text-xs text-gray-500">({r.count})</span>
                  </div>
                  <div className="text-white font-semibold">{formatRub(r.revenue)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

