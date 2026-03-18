import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";
import { cn } from "@/lib/utils";
import { getShopPaymentAttemptStatusMeta, getShopPaymentProviderLabel } from "@/lib/shop/order-status";

export default async function AdminShopPaymentsPage() {
  const prisma = getPrisma();
  const payments = await prisma.shopPayment.findMany({
    include: { order: { select: { id: true, orderNo: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Платежи</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">Дата</th>
              <th className="text-left p-4 text-gray-400 font-medium">Заказ</th>
              <th className="text-left p-4 text-gray-400 font-medium">Способ</th>
              <th className="text-left p-4 text-gray-400 font-medium">Статус</th>
              <th className="text-right p-4 text-gray-400 font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-gray-300">{new Date(p.createdAt).toLocaleString("ru-RU")}</td>
                <td className="p-4 text-white font-semibold">#{p.order.orderNo}</td>
                <td className="p-4 text-gray-300">
                  <div className="text-white">{getShopPaymentProviderLabel(p.provider)}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.provider}</div>
                </td>
                <td className="p-4 text-gray-300">
                  <div className={cn("font-medium", getShopPaymentAttemptStatusMeta(p.status).className)}>{getShopPaymentAttemptStatusMeta(p.status).label}</div>
                  <div className="text-xs text-gray-500 font-mono">{p.status}</div>
                </td>
                <td className="p-4 text-right text-white font-semibold">{formatRub(p.amountKopeks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 ? <div className="p-8 text-center text-gray-500">Нет платежей</div> : null}
      </div>
    </div>
  );
}
