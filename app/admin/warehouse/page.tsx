import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { WarehouseSwitcher } from "./warehouse-switcher";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Boxes, 
  Factory, 
  FileDown, 
  MapPin, 
  PackagePlus, 
  Receipt, 
  ScrollText, 
  Settings2, 
  Truck, 
  Users,
  ArrowRight,
  ClipboardCheck,
  History
} from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">Управление складом</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Stock & Logistics Control</p>
            {low > 0 && (
              <Badge variant="warning" className="animate-pulse px-1.5 py-0 text-[9px]">
                {low} критических позиций
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WarehouseSwitcher warehouses={warehouses} currentId={w} />
          <LinkButton href="/admin/logs" variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
            <History className="mr-2 h-3.5 w-3.5" />
            Логи
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <Link href={withW("/admin/warehouse/operations", w)} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-primary transition-colors">Операции</div>
          <div className="text-xs text-gray-500 leading-relaxed">Приход, списание и управление порогами остатков</div>
        </Link>

        <Link href={withW("/admin/warehouse/receipts", w)} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{receiptsDraft} черновиков</Badge>
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-emerald-400 transition-colors">Приходы</div>
          <div className="text-xs text-gray-500 leading-relaxed">Поступление товаров от поставщиков</div>
        </Link>

        <Link href={withW("/admin/warehouse/low-stock", w)} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <Boxes className="w-5 h-5 text-orange-400" />
            </div>
            <Badge variant="error" className="animate-pulse">{low} шт</Badge>
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-orange-400 transition-colors">Низкий остаток</div>
          <div className="text-xs text-gray-500 leading-relaxed">Товары, требующие немедленной закупки</div>
        </Link>

        <Link href={withW("/admin/warehouse/locations", w)} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">Локации</div>
          <div className="text-xs text-gray-500 leading-relaxed">Адресное хранение: стеллажи, полки и ячейки</div>
        </Link>

        <Link href="/admin/warehouse/suppliers" className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-purple-400 transition-colors">Поставщики</div>
          <div className="text-xs text-gray-500 leading-relaxed">База контрагентов и условия поставок</div>
        </Link>

        <Link href={withW("/admin/warehouse/inventory", w)} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-teal-500/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <ClipboardCheck className="w-5 h-5 text-teal-400" />
            </div>
            <Badge variant="secondary">{invDraft} в работе</Badge>
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-teal-400 transition-colors">Инвентаризация</div>
          <div className="text-xs text-gray-500 leading-relaxed">Сверка фактических остатков на складе</div>
        </Link>

        <Link href={withW("/admin/warehouse/catalog", w)} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <Boxes className="w-5 h-5 text-primary" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-primary transition-colors">Каталог</div>
          <div className="text-xs text-gray-500 leading-relaxed">Полный список товаров, цены и управление публикацией</div>
        </Link>

        <Link href={withW("/admin/warehouse/reports", w)} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-indigo-400 transition-colors">Отчёты</div>
          <div className="text-xs text-gray-500 leading-relaxed">Аналитика: расход, брак, COGS и оборачиваемость</div>
        </Link>

        <Link href="/api/admin/logs/export?type=warehouse" className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-2xl overflow-hidden hover:border-slate-500/40 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
              <FileDown className="w-5 h-5 text-gray-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <div className="text-white font-bold text-lg mb-1 group-hover:text-white transition-colors">Экспорт</div>
          <div className="text-xs text-gray-500 leading-relaxed">Выгрузка всех складских операций в формате CSV</div>
        </Link>
      </div>
    </div>
  );
}
