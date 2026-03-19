import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { CategoriesClient } from "./categories-client";
import { LinkButton } from "@/components/ui/button";
import { Boxes, LayoutGrid } from "lucide-react";

export default async function AdminWarehouseCategoriesPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const prisma = getPrisma();
  const categories = await prisma.shopCategory.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { name: "asc" },
    take: 500,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Категории</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Product Taxonomy Management</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LinkButton href="/admin/warehouse" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <Boxes className="mr-2 h-3.5 w-3.5" />
            Склад
          </LinkButton>
          <LinkButton href="/admin/warehouse/catalog" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <LayoutGrid className="mr-2 h-3.5 w-3.5" />
            Каталог
          </LinkButton>
        </div>
      </div>
      <CategoriesClient initial={categories} />
    </div>
  );
}

