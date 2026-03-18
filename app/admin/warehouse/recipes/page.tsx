import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";

type SearchParams = { w?: string };

export default async function AdminWarehouseRecipesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.recipes.manage");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();
  const [products, recipes] = await Promise.all([
    prisma.shopProduct.findMany({
      select: { id: true, name: true, sku: true, slug: true, itemType: true, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.warehouseRecipe.findMany({ select: { productId: true, isActive: true, version: true } }),
  ]);

  const byProduct = new Map(recipes.map((r) => [r.productId, r]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Рецептуры</h1>
          <div className="text-sm text-gray-400 mt-1">Сырьё → продукт</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
          <Link href={`/admin/warehouse/production?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Производство
          </Link>
          <Link href={`/admin/warehouse/catalog?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Каталог
          </Link>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Товары (последние 300)</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Товар</th>
              <th className="p-4 text-left font-medium">Тип</th>
              <th className="p-4 text-left font-medium">Рецепт</th>
              <th className="p-4 text-right font-medium">Открыть</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.map((p) => {
              const r = byProduct.get(p.id);
              return (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="text-white font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{p.sku || "—"}</div>
                  </td>
                  <td className="p-4 text-gray-300">{p.itemType}</td>
                  <td className="p-4 text-gray-300">{r ? `${r.isActive ? "активен" : "выкл"} v${r.version}` : "—"}</td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/warehouse/recipes/${p.id}?w=${w}`} className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium transition-colors">
                      Открыть
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
