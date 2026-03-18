import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { RecipeClient } from "./recipe-client";

type SearchParams = { w?: string };

export default async function AdminWarehouseRecipeProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.recipes.manage");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const { productId } = await params;
  const id = parseInt(productId, 10);
  if (!Number.isFinite(id)) notFound();

  const [product, materials, recipe] = await Promise.all([
    prisma.shopProduct.findUnique({ where: { id }, select: { id: true, name: true, sku: true, itemType: true } }),
    prisma.shopProduct.findMany({ select: { id: true, name: true, sku: true, itemType: true }, orderBy: { name: "asc" }, take: 2000 }),
    prisma.warehouseRecipe.findUnique({
      where: { productId: id },
      select: { isActive: true, items: { select: { materialProductId: true, quantity: true, unit: true } } },
    }),
  ]);

  if (!product) notFound();

  return (
    <RecipeClient
      product={product}
      materials={materials as any}
      warehouseId={w}
      initial={
        recipe
          ? {
              isActive: recipe.isActive,
              items: recipe.items.map((i) => ({ materialProductId: i.materialProductId, quantity: i.quantity.toString(), unit: i.unit })),
            }
          : null
      }
    />
  );
}
