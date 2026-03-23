import { getPurchaseOrders } from "@/app/actions/warehouse-purchase";
import { getPrisma } from "@/lib/prisma";
import { PurchaseOrdersClient } from "./purchase-orders-client";

export default async function PurchaseOrdersPage() {
  const prisma = getPrisma();
  const [orders, suppliers, products] = await Promise.all([
    getPurchaseOrders(),
    prisma.warehouseSupplier.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.shopProduct.findMany({ select: { id: true, name: true, sku: true } }),
  ]);

  return (
    <div className="container mx-auto p-6">
      <PurchaseOrdersClient 
        initialOrders={orders as any} 
        suppliers={suppliers} 
        products={products}
      />
    </div>
  );
}
