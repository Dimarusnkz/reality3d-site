import { Suspense } from "react";
import { DashboardStats, StatsSkeleton } from "./dashboard-stats";
import { RecentOrders, RecentOrdersSkeleton } from "./recent-orders";
import { RecentFinance, RecentFinanceSkeleton } from "./recent-finance";
import { ServerMetricsPanel } from "./server-metrics-panel";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || !["admin", "manager", "engineer", "warehouse", "delivery"].includes(session.role)) {
    redirect("/lk");
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">DASHBOARD</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            Панель управления <span className="h-1 w-1 rounded-full bg-primary animate-pulse"></span> Reality3D
          </p>
        </div>
        <div className="flex gap-3">
           <div className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest">
             Role: <span className="text-primary">{session.role}</span>
           </div>
        </div>
      </div>

      {/* Stats with Streaming */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Server Metrics for Admins */}
      {session.role === "admin" && (
        <div className="neon-card rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/20">
          <ServerMetricsPanel className="border-0 bg-transparent" />
        </div>
      )}

      {/* Main Grid with Streaming */}
      <div className="grid lg:grid-cols-2 gap-10">
        <Suspense fallback={<RecentOrdersSkeleton />}>
          <RecentOrders />
        </Suspense>
        
        <Suspense fallback={<RecentFinanceSkeleton />}>
          <RecentFinance />
        </Suspense>
      </div>
    </div>
  );
}
