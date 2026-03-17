import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { formatRub } from "@/lib/shop/money";

export default async function AdminShopOrdersPage() {
  const prisma = getPrisma();
  const orders = await prisma.shopOrder.findMany({
    include: { user: { select: { id: true, email: true, name: true } }, payments: { take: 1, orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Заказы магазина</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="text-left p-4 text-gray-400 font-medium">Заказ</th>
              <th className="text-left p-4 text-gray-400 font-medium">Покупатель</th>
              <th className="text-left p-4 text-gray-400 font-medium">Доставка</th>
              <th className="text-left p-4 text-gray-400 font-medium">Оплата</th>
              <th className="text-right p-4 text-gray-400 font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <Link href={`/shop/order/${o.id}`} target="_blank" className="text-white font-semibold hover:text-primary transition-colors">
                    #{o.orderNo}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(o.createdAt).toLocaleString("ru-RU")}
                  </div>
                </td>
                <td className="p-4 text-gray-300">
                  {o.user ? (
                    <div>
                      <div className="text-white">{o.user.name || o.user.email}</div>
                      <div className="text-xs text-gray-500">{o.user.email}</div>
                    </div>
                  ) : (
                    <div className="text-gray-500">—</div>
                  )}
                </td>
                <td className="p-4 text-gray-300">
                  <div className="text-white">{o.shippingMethod}</div>
                  {o.shippingMethod === "pickup" ? (
                    <div className="text-xs text-gray-500">Самовывоз</div>
                  ) : (
                    <div className="text-xs text-gray-500">{o.deliveryCity || "—"}</div>
                  )}
                </td>
                <td className="p-4 text-gray-300">
                  <div className="text-white">{o.paymentProvider || "—"}</div>
                  <div className="text-xs text-gray-500">{o.paymentStatus}</div>
                </td>
                <td className="p-4 text-right text-white font-semibold">{formatRub(o.totalKopeks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <div className="p-8 text-center text-gray-500">Нет заказов</div> : null}
      </div>
    </div>
  );
}

