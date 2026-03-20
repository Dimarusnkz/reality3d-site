import { getClientOrders, getClientShopOrders } from '@/app/actions/orders';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import UnifiedOrdersList from './unified-orders-list';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const session = await getSession();
  if (!session?.userId) redirect('/login?redirectTo=/lk/orders');

  const [orders, shopOrders] = await Promise.all([getClientOrders(), getClientShopOrders()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Мои заказы</h1>
        <p className="text-gray-400 mt-2">Управление заказами 3D‑печати и покупками в магазине</p>
      </div>

      <UnifiedOrdersList calcOrders={orders} shopOrders={shopOrders as any} />
    </div>
  );
}
