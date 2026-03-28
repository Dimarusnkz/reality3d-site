import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { OrderAdminClient } from "./order-admin-client";

export default async function AdminShopOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "shop.orders.manage");
  if (!allowed) redirect("/admin");

  const { id } = await params;
  const prisma = getPrisma();

  const order = await prisma.shopOrder.findUnique({
    where: { id },
    select: {
      id: true,
      orderNo: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      paymentProvider: true,
      totalKopeks: true,
      shippingMethod: true,
      shippingCarrier: true,
      shippingStatus: true,
      shippingTrackingNo: true,
      shippingCostFinalKopeks: true,
      contactName: true,
      contactPhone: true,
      contactEmail: true,
      deliveryCity: true,
      deliveryAddress: true,
      deliveryPhone: true,
      comment: true,
      items: { orderBy: { createdAt: "asc" }, select: { id: true, productName: true, sku: true, quantity: true, unitPriceKopeks: true, totalKopeks: true } },
    },
  });
  if (!order) notFound();

  const audit = await prisma.auditEvent.findMany({
    where: { target: String(order.orderNo) },
    select: { id: true, createdAt: true, action: true, actorUserId: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <OrderAdminClient
      userRole={session.role}
      order={{
        ...order,
        createdAt: order.createdAt.toISOString(),
      }}
      audit={audit.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
    />
  );
}

