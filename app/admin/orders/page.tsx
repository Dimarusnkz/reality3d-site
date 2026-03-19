import { getOrders } from "@/app/actions/orders";
import { getSession } from "@/lib/session";
import OrdersClient from "./orders-client";

export default async function AdminOrdersPage() {
  const session = await getSession();
  const orders = await getOrders();

  return (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Управление заказами</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">3D Printing Order Management</p>
        </div>
      </div>
      <OrdersClient initialOrders={orders} currentUserRole={session?.role || 'user'} />
    </div>
  );
}
