import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/access";
import { BarChart3, Calculator, Flame, Gauge, ShieldAlert } from "lucide-react";

type SearchParams = { w?: string };

export default async function AdminWarehouseReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/login");
  const userId = parseInt(session.userId, 10);
  const allowed = await hasPermission(userId, session.role, "warehouse.view");
  if (!allowed) redirect("/admin");

  const sp = await searchParams;
  const warehouseId = sp.w ? parseInt(sp.w, 10) : 1;
  const w = Number.isFinite(warehouseId) ? warehouseId : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Отчёты склада</h1>
          <div className="text-sm text-gray-400 mt-1">Расход сырья / брак / себестоимость продаж / оборачиваемость</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/admin/warehouse?w=${w}`} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Склад
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Link href={`/admin/warehouse/reports/consumption?w=${w}`} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Расход сырья</div>
            <Flame className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">По производству</div>
        </Link>

        <Link href={`/admin/warehouse/reports/scrap?w=${w}`} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Брак</div>
            <ShieldAlert className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Списания по дефекту</div>
        </Link>

        <Link href={`/admin/warehouse/reports/cogs?w=${w}`} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Себестоимость</div>
            <Calculator className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">COGS по продажам</div>
        </Link>

        <Link href={`/admin/warehouse/reports/turnover?w=${w}`} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-900 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold text-lg">Оборачиваемость</div>
            <Gauge className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-400 mt-2">Продажи vs остаток</div>
        </Link>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-gray-400" />
          <div className="text-sm text-gray-400">Экспорт доступен на странице каждого отчёта (CSV).</div>
        </div>
      </div>
    </div>
  );
}

