import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { WarehouseSwitcher } from "./warehouse-switcher";
import { BarChart3, Boxes, Factory, FileDown, MapPin, PackagePlus, Receipt, ScrollText, Settings2, Truck, Users } from "lucide-react";

type SearchParams = { w?: string };

function withW(path: string, w: number) {
  const u = new URL("http://local" + path);
  u.searchParams.set("w", String(w));
  return u.pathname + "?" + u.searchParams.toString();
}

export default async function AdminWarehousePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  const prisma = getPrisma();

  const [warehouses, inventory, receiptsDraft, prodDraft, invDraft] = await Promise.all([
    prisma.warehouse.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { id: "asc" } }),
    prisma.shopInventoryItem.findMany({
      where: { warehouseId: w },
      select: { quantity: true, reserved: true, minThreshold: true },
      take: 5000,
    }),
    prisma.warehouseReceipt.count({ where: { warehouseId: w, status: "draft" } }),
    prisma.warehouseProductionOrder.count({ where: { warehouseId: w, status: "draft" } }),
    prisma.warehouseInventoryCount.count({ where: { warehouseId: w, status: "draft" } }),
  ]);

  const low = inventory.filter((i) => Number(i.minThreshold) > 0 && Number(i.quantity) - Number(i.reserved) <= Number(i.minThreshold)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Склад</h1>
          <div className="text-sm text-gray-400 mt-1">
            Низкий остаток: <span className="text-white font-semibold">{low}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WarehouseSwitcher warehouses={warehouses} currentId={w} />
          <Link href="/admin/logs" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Логи
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Link href={withW("/admin/warehouse/operations", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Операции</div>
            <Settings2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Приход / списание / пороги</div>
        </Link>

        <Link href={withW("/admin/warehouse/receipts", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Приходы</div>
            <Receipt className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Черновики: <span className="text-white font-semibold">{receiptsDraft}</span>
          </div>
        </Link>

        <Link href={withW("/admin/warehouse/low-stock", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Низкий остаток</div>
            <Boxes className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Позиций: <span className="text-white font-semibold">{low}</span>
          </div>
        </Link>

        <Link href={withW("/admin/warehouse/locations", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Локации</div>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Стеллажи / полки / ячейки</div>
        </Link>

        <Link href="/admin/warehouse/suppliers" className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Поставщики</div>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Контакты и договоры</div>
        </Link>

        <Link href={withW("/admin/warehouse/recipes", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Рецептуры</div>
            <ScrollText className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Сырьё → продукт</div>
        </Link>

        <Link href={withW("/admin/warehouse/production", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Производство</div>
            <Factory className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Черновики: <span className="text-white font-semibold">{prodDraft}</span>
          </div>
        </Link>

        <Link href={withW("/admin/warehouse/inventory", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Инвентаризация</div>
            <PackagePlus className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Черновики: <span className="text-white font-semibold">{invDraft}</span>
          </div>
        </Link>

        <Link href={withW("/admin/warehouse/reports", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Отчёты</div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Расход / брак / COGS / оборачиваемость</div>
        </Link>

        <Link href={withW("/admin/warehouse/transfers", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Перемещения</div>
            <Truck className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Между локациями / складами</div>
        </Link>

        <Link href={withW("/admin/warehouse/catalog", w)} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Каталог</div>
            <Boxes className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Товары, цены, остатки</div>
        </Link>

        <Link href="/admin/warehouse/warehouses" className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Склады</div>
            <Boxes className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Управление складами</div>
        </Link>

        <Link href="/api/admin/logs/export?type=warehouse" className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Экспорт логов</div>
            <FileDown className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">CSV</div>
        </Link>
      </div>
    </div>
  );
}
