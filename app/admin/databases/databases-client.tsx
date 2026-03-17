"use client";

import { useMemo, useState, useTransition } from "react";
import { switchDatabase, getDatabasesHealth } from "@/app/actions/databases";
import { AlertCircle, CheckCircle2, Database, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export default function DatabasesClient({ initial }: { initial: any }) {
  const [data, setData] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const current = data?.current as string | undefined;
  const items = useMemo(() => (data?.results || []) as Array<any>, [data]);
  const canSwitch = useMemo(() => items.some((x) => x.enabled), [items]);

  const refresh = () => {
    setError(null);
    startTransition(async () => {
      const next = await getDatabasesHealth();
      setData(next as any);
    });
  };

  const onSwitch = (provider: "postgres" | "sqlite" | "mysql") => {
    setError(null);
    startTransition(async () => {
      const res = await switchDatabase(provider, getCsrfToken());
      if ((res as any)?.success) {
        const next = await getDatabasesHealth();
        setData(next as any);
        return;
      }
      setError((res as any)?.error || "Не удалось переключить режим");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Базы данных</h1>
          <p className="text-sm text-slate-400">Проверка доступности и переключение режима Prisma.</p>
        </div>
        <button
          onClick={refresh}
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-white hover:bg-slate-900",
            isPending && "opacity-60 pointer-events-none"
          )}
        >
          <RefreshCcw className="h-4 w-4" />
          Обновить
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((row) => (
          <div key={row.provider} className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-400" />
                <div className="text-sm font-semibold text-white">{row.provider}</div>
              </div>
              <div
                className={cn(
                  "text-xs rounded-full px-2 py-1",
                  row.enabled && row.ok
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : row.enabled
                      ? "bg-red-500/10 text-red-300 border border-red-500/20"
                      : "bg-slate-500/10 text-slate-300 border border-slate-500/20"
                )}
              >
                {row.enabled ? (row.ok ? "OK" : "Ошибка") : "Не настроено"}
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400">
              {row.enabled ? (
                row.ok ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Latency: {row.latencyMs}ms</span>
                  </div>
                ) : (
                  <div className="text-red-300">{row.error}</div>
                )
              ) : (
                <div>Укажи URL в переменных окружения</div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={() => onSwitch(row.provider)}
                disabled={isPending || !row.enabled || !canSwitch}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-sm font-medium",
                  row.provider === current
                    ? "bg-slate-800 text-slate-200"
                    : "bg-primary text-white hover:bg-primary/90",
                  (!row.enabled || isPending) && "opacity-50 pointer-events-none"
                )}
              >
                {row.provider === current ? "Текущий режим" : "Переключить"}
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Переключение сохраняется только в памяти процесса (для serverless потребуется env + redeploy).
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-sm font-semibold text-white">Миграции</div>
        <div className="mt-2 grid gap-2 text-xs text-slate-300 font-mono">
          <div>postgres: npm run db:migrate</div>
          <div>sqlite: npm run db:migrate:sqlite</div>
          <div>mysql: npm run db:migrate:mysql</div>
        </div>
      </div>
    </div>
  );
}
