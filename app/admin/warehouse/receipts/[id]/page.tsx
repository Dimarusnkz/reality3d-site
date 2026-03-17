import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { ReceiptClient } from "./receipt-client";

export default async function AdminWarehouseReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.receipt");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const { id } = await params;

  const [receipt, suppliers, products] = await Promise.all([
    prisma.warehouseReceipt.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        supplierId: true,
        documentNo: true,
        receivedAt: true,
        attachmentUrl: true,
        comment: true,
        supplier: { select: { name: true } },
        items: {
          orderBy: { createdAt: "asc" },
          select: { id: true, productId: true, sku: true, productName: true, quantity: true, unit: true, unitCostKopeks: true, totalCostKopeks: true },
        },
      },
    }),
    prisma.warehouseSupplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 2000 }),
    prisma.shopProduct.findMany({ select: { id: true, name: true, sku: true }, orderBy: { name: "asc" }, take: 2000 }),
  ]);

  if (!receipt) notFound();

  return (
    <ReceiptClient
      suppliers={suppliers as any}
      products={products as any}
      receipt={{
        id: receipt.id,
        status: receipt.status,
        supplierId: receipt.supplierId,
        supplierName: receipt.supplier?.name || null,
        documentNo: receipt.documentNo,
        receivedAt: receipt.receivedAt.toISOString(),
        attachmentUrl: receipt.attachmentUrl,
        comment: receipt.comment,
        items: receipt.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity.toString(),
          unit: i.unit,
          unitCostKopeks: i.unitCostKopeks,
          totalCostKopeks: i.totalCostKopeks,
        })),
      }}
    />
  );
}

