import { getPurchaseOrderDetails, getPurchaseDiscrepancy } from "@/app/actions/warehouse-purchase";
import { PurchaseOrderDetailsClient } from "./purchase-order-details-client";
import { notFound } from "next/navigation";

export default async function PurchaseOrderDetailsPage({ params }: { params: { id: string } }) {
  const [order, discrepancy] = await Promise.all([
    getPurchaseOrderDetails(params.id),
    getPurchaseDiscrepancy(params.id),
  ]);

  if (!order) notFound();

  return (
    <div className="container mx-auto p-6">
      <PurchaseOrderDetailsClient 
        order={order as any} 
        discrepancy={discrepancy as any}
      />
    </div>
  );
}
