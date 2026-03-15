import { getOrders } from "@/app/actions/orders";
import { getSession } from "@/lib/session";
import OrdersClient from "./orders-client";

export default async function AdminOrdersPage() {
  const session = await getSession();
  const orders = await getOrders();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Управление заказами</h1>
        <p className="text-gray-400">Отслеживание и обработка заказов клиентов</p>
      </div>
      <OrdersClient initialOrders={orders} currentUserRole={session?.role || 'user'} />
    </div>
  );
}
