import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { ReceiptsClient } from "./receipts-client";

export default async function AdminWarehouseReceiptsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.receipt");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const [suppliers, receipts] = await Promise.all([
    prisma.warehouseSupplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 2000 }),
    prisma.warehouseReceipt.findMany({
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
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Приходы</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse/suppliers" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Поставщики
          </Link>
          <Link href="/admin/warehouse/catalog" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Каталог
          </Link>
        </div>
      </div>

      <ReceiptsClient
        suppliers={suppliers as any}
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

