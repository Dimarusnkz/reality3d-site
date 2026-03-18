import { getClientOrders, getClientShopOrders } from '@/app/actions/orders';
import OrdersList from './orders-list';
import ShopOrdersList from './shop-orders-list';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [orders, shopOrders] = await Promise.all([getClientOrders(), getClientShopOrders()]);

  return (
    <div className="space-y-12">
      <OrdersList initialOrders={orders} />
      <ShopOrdersList orders={shopOrders as any} />
    </div>
  );
}
