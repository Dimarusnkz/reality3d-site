import { getClientOrders } from '@/app/actions/orders';
import OrdersList from './orders-list';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await getClientOrders();

  return <OrdersList initialOrders={orders} />;
}
