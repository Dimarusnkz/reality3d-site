import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { CategoriesClient } from "./categories-client";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Категории</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouse" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href="/admin/warehouse/catalog" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Каталог
          </Link>
        </div>
      </div>
      <CategoriesClient initial={categories} />
    </div>
  );
}

