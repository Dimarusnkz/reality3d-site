import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { ProductForm } from "@/app/admin/shop/products/product-form";

export default async function AdminWarehouseNewProductPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "warehouse.receipt");
  if (!allowed) redirect("/admin");
  const canEditPurchasePrice = await hasPermission(userId, session.role, "products.purchase_price.edit");

  const prisma = getPrisma();
  const categories = await prisma.shopCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Новый товар</h1>
        <Link
          href="/admin/warehouse/catalog"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          Назад
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <ProductForm 
          categories={categories} 
          canEditPurchasePrice={canEditPurchasePrice} 
          userRole={session.role}
        />
      </div>
    </div>
  );
}
