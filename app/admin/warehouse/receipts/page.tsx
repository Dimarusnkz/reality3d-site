import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { ReceiptsClient } from "./receipts-client";

type SearchParams = { w?: string };

export default async function AdminWarehouseReceiptsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.receipt");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const [suppliers, receipts, locations, purchaseOrders] = await Promise.all([
    prisma.warehouseSupplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 2000 }),
    prisma.warehouseReceipt.findMany({
      where: { warehouseId: w },
      select: {
        id: true,
        status: true,
        receivedAt: true,
        documentNo: true,
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { receivedAt: "desc" },
      take: 200,
    }),
    prisma.warehouseLocation.findMany({ where: { warehouseId: w, isActive: true }, select: { id: true, code: true, name: true }, orderBy: { code: "asc" }, take: 2000 }),
    prisma.warehousePurchaseOrder.findMany({ 
      where: { status: { in: ['pending', 'partially_received'] } },
      select: { id: true, orderNo: true, supplier: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Приходы</h1>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href="/admin/warehouse/purchase" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Закупки
          </Link>
          <Link href="/admin/warehouse/suppliers" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Поставщики
          </Link>
          <Link href={`/admin/warehouse/catalog?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Каталог
          </Link>
        </div>
      </div>

      <ReceiptsClient
        suppliers={suppliers as any}
        locations={locations as any}
        purchaseOrders={purchaseOrders as any}
        warehouseId={w}
        rows={receipts.map((r) => ({
          id: r.id,
          status: r.status,
          receivedAt: r.receivedAt.toISOString(),
          documentNo: r.documentNo,
          supplierName: r.supplier?.name || null,
          itemsCount: r._count.items,
        }))}
      />
    </div>
  );
}
