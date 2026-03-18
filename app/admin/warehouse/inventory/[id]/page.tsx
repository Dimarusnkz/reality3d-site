import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { InventoryViewClient } from "./inventory-view-client";

type SearchParams = { w?: string };

export default async function AdminWarehouseInventoryItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.inventory");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const { id } = await params;
  const sp = await searchParams;
  const wRaw = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(wRaw) ? wRaw : 1;

  const [inv, products] = await Promise.all([
    prisma.warehouseInventoryCount.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startedAt: true,
        comment: true,
        items: { select: { productId: true, expectedQty: true, countedQty: true, delta: true, unit: true, product: { select: { name: true, sku: true, itemType: true } } } },
      },
    }),
    prisma.shopProduct.findMany({ select: { id: true, name: true, sku: true, itemType: true }, orderBy: { name: "asc" }, take: 2000 }),
  ]);

  if (!inv) notFound();

  return (
    <InventoryViewClient
      products={products as any}
      warehouseId={w}
      inv={{
        id: inv.id,
        status: inv.status,
        startedAt: inv.startedAt.toISOString(),
        comment: inv.comment,
        items: inv.items.map((i) => ({
          productId: i.productId,
          name: i.product.name,
          sku: i.product.sku,
          expectedQty: i.expectedQty.toString(),
          countedQty: i.countedQty.toString(),
          delta: i.delta.toString(),
          unit: i.unit,
        })),
      }}
    />
  );
}
