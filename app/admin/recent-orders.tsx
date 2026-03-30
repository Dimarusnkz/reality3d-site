import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { Badge } from "@/components/ui/badge";
import { getShopOrderStatusMeta, getShopPaymentStatusMeta } from "@/lib/shop/order-status";
import Link from "next/link";

export async function RecentOrders() {
  const prisma = getPrisma();
  const recentShopOrders = await prisma.shopOrder.findMany({
    select: { id: true, orderNo: true, totalKopeks: true, status: true, paymentStatus: true, createdAt: true, contactName: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="neon-card rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Последние заказы</h2>
        <Link href="/admin/shop/orders" className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors">
          Все заказы
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/50 text-gray-500 border-b border-slate-800/50">
            <tr>
              <th className="px-6 py-3 font-bold uppercase tracking-tighter">Заказ</th>
              <th className="px-6 py-3 font-bold uppercase tracking-tighter">Клиент</th>
              <th className="px-6 py-3 font-bold uppercase tracking-tighter">Сумма</th>
              <th className="px-6 py-3 font-bold uppercase tracking-tighter text-right">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {recentShopOrders.map((order) => {
              const statusMeta = getShopOrderStatusMeta(order.status);
              const paymentMeta = getShopPaymentStatusMeta(order.paymentStatus);
              return (
                <tr key={order.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/admin/shop/orders?orderId=${order.id}`} className="font-bold text-white hover:text-primary transition-colors">
                      #{order.orderNo}
                    </Link>
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-300 font-medium truncate max-w-[120px]">{order.contactName || "—"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-bold">{formatRub(order.totalKopeks)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant={statusMeta.variant} className="text-[8px] px-1.5 py-0">
                      {statusMeta.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RecentOrdersSkeleton() {
  return (
    <div className="neon-card rounded-2xl border border-slate-800 bg-slate-900/20 h-[400px] animate-pulse">
      <div className="p-6 border-b border-slate-800 h-14"></div>
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 bg-slate-800/50 rounded"></div>
        ))}
      </div>
    </div>
  );
}
