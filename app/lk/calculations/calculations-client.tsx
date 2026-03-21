"use client";

import { useMemo, useState } from "react";
import { Calculator, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalcRow = {
  id: string;
  createdAt: string;
  mode: string;
  tech: string;
  material: string;
  count: number;
  fileName: string | null;
  fileSize: number | null;
  manualWeightGrams: number | null;
  manualTimeHours: number | null;
  minPriceRub: number;
  maxPriceRub: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function CalculationsClient({ initial }: { initial: CalcRow[] }) {
  const [q, setQ] = useState("");
  const rows = initial || [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const hay = [
        r.tech,
        r.material,
        r.mode,
        r.fileName || "",
        String(r.minPriceRub),
        String(r.maxPriceRub),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [rows, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Мои расчеты</h1>
          <p className="text-gray-400 text-sm">История предварительных расчетов стоимости</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Поиск..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Расчётов пока нет"
          description="Создайте расчёт в калькуляторе — он появится здесь."
          actions={
            <LinkButton href="/calculator" size="sm">
              Перейти в калькулятор
            </LinkButton>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Ничего не найдено" description="Измените запрос поиска." />
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => {
            const dt = new Date(r.createdAt);
            const labelMode = r.mode === "manual" ? "Параметры" : "Файл";
            const subtitle =
              r.mode === "file"
                ? r.fileName
                  ? `${r.fileName}${r.fileSize ? ` · ${formatBytes(r.fileSize)}` : ""}`
                  : "Файл не указан"
                : `${r.manualWeightGrams ?? 0} г · ${r.manualTimeHours ?? 0} ч`;

            return (
              <div key={r.id} className="neon-card p-4 sm:p-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/80">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold bg-slate-800 text-gray-400 px-2 py-1 rounded">{labelMode}</span>
                    <span className="text-sm text-gray-500">{dt.toLocaleString("ru-RU")}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {r.tech.toUpperCase()} / <span className="text-primary">{r.material.toUpperCase()}</span>
                    {r.count > 1 ? <span className="text-gray-500 font-bold text-sm ml-2">×{r.count}</span> : null}
                  </h3>
                  <p className="text-sm text-gray-400">{subtitle}</p>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="text-sm text-gray-500">Предварительно</div>
                  <div className="text-2xl font-bold text-white">
                    {r.minPriceRub.toLocaleString("ru-RU")} – {r.maxPriceRub.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className={cn("text-xs mt-1", "text-gray-500")}>ID: {r.id.slice(0, 8)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

