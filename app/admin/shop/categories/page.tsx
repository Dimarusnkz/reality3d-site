import { getPrisma } from "@/lib/prisma";
import { CategoriesClient } from "./categories-client";

export default async function AdminShopCategoriesPage() {
  const prisma = getPrisma();
  const categories = await prisma.shopCategory.findMany({
    select: { id: true, name: true, slug: true, parentId: true },
    orderBy: { name: "asc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Категории</h1>
      <CategoriesClient initial={categories} />
    </div>
  );
}

