import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { ProductionViewClient } from "./view-client";

export default async function AdminWarehouseProductionItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.production");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const { id } = await params;

  const prod = await prisma.warehouseProductionOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      postedAt: true,
      comment: true,
      quantity: true,
      unit: true,
      product: { select: { id: true, name: true, sku: true } },
      consumes: { select: { id: true, material: { select: { name: true, sku: true } }, quantity: true, unit: true, totalCostKopeks: true } },
    },
  });

  if (!prod) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Производство</h1>
          <div className="text-sm text-gray-400 mt-1">
            {prod.product.name} — {prod.quantity.toString()} {prod.unit}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse/production" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Назад
          </Link>
        </div>
      </div>

      <ProductionViewClient
        prod={{
          id: prod.id,
          status: prod.status,
          createdAt: prod.createdAt.toISOString(),
          postedAt: prod.postedAt ? prod.postedAt.toISOString() : null,
          comment: prod.comment,
          productName: prod.product.name,
          productSku: prod.product.sku,
          quantity: prod.quantity.toString(),
          unit: prod.unit,
          consumes: prod.consumes.map((c) => ({
            id: c.id,
            name: c.material.name,
            sku: c.material.sku,
            quantity: c.quantity.toString(),
            unit: c.unit,
            totalCostKopeks: c.totalCostKopeks ?? null,
          })),
        }}
      />
    </div>
  );
}

