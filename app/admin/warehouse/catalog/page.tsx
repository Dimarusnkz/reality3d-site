import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Plus, Tag, ArrowDownCircle, AlertTriangle } from "lucide-react";
import CatalogProductsTable from "./products-table";

type SearchParams = { w?: string };

export default async function AdminWarehouseCatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const products = await prisma.shopProduct.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 }, inventoryItems: { where: { warehouseId: w }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">Складской каталог</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Inventory & Pricing Management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton
            href={`/admin/warehouse/catalog/new?w=${w}`}
            variant="primary"
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px]"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Добавить товар
          </LinkButton>
          <LinkButton
            href={`/admin/warehouse/categories?w=${w}`}
            variant="secondary"
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px]"
          >
            <Tag className="mr-2 h-3.5 w-3.5" />
            Категории
          </LinkButton>
          <LinkButton
            href={`/admin/warehouse/receipts?w=${w}`}
            variant="secondary"
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px]"
          >
            <ArrowDownCircle className="mr-2 h-3.5 w-3.5" />
            Приходы
          </LinkButton>
          <LinkButton
            href={`/admin/warehouse/low-stock?w=${w}`}
            variant="secondary"
            size="sm"
            className="font-bold uppercase tracking-widest text-[10px] text-orange-400 hover:text-orange-300"
          >
            <AlertTriangle className="mr-2 h-3.5 w-3.5" />
            Низкий остаток
          </LinkButton>
        </div>
      </div>

      <CatalogProductsTable initialProducts={products as any[]} warehouseId={w} />
    </div>
  );
}
