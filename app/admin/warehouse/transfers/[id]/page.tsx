import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { TransferClient } from "./transfer-client";

type SearchParams = { w?: string };

export default async function AdminWarehouseTransferPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.transfer");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const wRaw = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(wRaw) ? wRaw : 1;

  const prisma = getPrisma();
  const { id } = await params;

  const [tr, products] = await Promise.all([
    prisma.warehouseTransfer.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        comment: true,
        fromWarehouse: { select: { code: true } },
        toWarehouse: { select: { code: true } },
        fromLocation: { select: { code: true } },
        toLocation: { select: { code: true } },
        items: { orderBy: { createdAt: "asc" }, select: { id: true, productId: true, sku: true, productName: true, quantity: true, unit: true } },
      },
    }),
    prisma.shopProduct.findMany({ select: { id: true, name: true, sku: true, itemType: true }, orderBy: { name: "asc" }, take: 2000 }),
  ]);

  if (!tr) notFound();

  return (
    <TransferClient
      warehouseId={w}
      products={products as any}
      transfer={{
        id: tr.id,
        status: tr.status,
        createdAt: tr.createdAt.toISOString(),
        fromLabel: `${tr.fromWarehouse.code}${tr.fromLocation?.code ? `/${tr.fromLocation.code}` : ""}`,
        toLabel: `${tr.toWarehouse.code}${tr.toLocation?.code ? `/${tr.toLocation.code}` : ""}`,
        comment: tr.comment,
        items: tr.items.map((i) => ({ id: i.id, productId: i.productId, sku: i.sku, productName: i.productName, quantity: i.quantity.toString(), unit: i.unit })),
      }}
    />
  );
}

