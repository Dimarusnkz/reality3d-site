"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Cpu, HardDrive, Network, Server, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Metrics = {
  ok: true;
  at: number;
  load: number[];
  cpu: { idle: number; total: number };
  mem: { totalBytes: number; freeBytes: number };
  disk: { totalBytes: number; freeBytes: number } | null;
  net: { rxBytes: number; txBytes: number } | null;
};

function formatBytes(value: number) {
  const v = Math.max(0, value || 0);
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  let n = v;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const digits = i === 0 ? 0 : i <= 2 ? 1 : 2;
  return `${n.toFixed(digits)} ${units[i]}`;
}

export function ServerMetricsPanel({ className }: { className?: string }) {
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const last = useRef<Metrics | null>(null);

  useEffect(() => {
    let active = true;
    let timer: any = null;

    const tick = async () => {
      try {
        const res = await fetch("/api/admin/system/metrics", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as Metrics | { ok?: false } | null;
        if (!active) return;
        if (!res.ok || !json || (json as any).ok !== true) {
          setError("Нет доступа или ошибка запроса");
          setIsLoading(false);
          return;
        }
        setData(json as Metrics);
        setError(null);
        setIsLoading(false);
      } catch {
        if (!active) return;
        setError("Ошибка запроса");
        setIsLoading(false);
      }
    };

    tick();
    timer = setInterval(tick, 2000);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const computed = useMemo(() => {
    if (!data) return null;
    const prev = last.current;
    last.current = data;

    const totalDelta = prev ? data.cpu.total - prev.cpu.total : 0;
    const idleDelta = prev ? data.cpu.idle - prev.cpu.idle : 0;
    const cpuPct = totalDelta > 0 ? Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100)) : null;

    const memUsed = data.mem.totalBytes - data.mem.freeBytes;
    const memPct = data.mem.totalBytes > 0 ? Math.max(0, Math.min(100, (memUsed / data.mem.totalBytes) * 100)) : null;

    const diskUsed = data.disk ? data.disk.totalBytes - data.disk.freeBytes : null;
    const diskPct = data.disk && data.disk.totalBytes > 0 ? Math.max(0, Math.min(100, (diskUsed! / data.disk.totalBytes) * 100)) : null;

    const dt = prev ? (data.at - prev.at) / 1000 : 0;
    const rxPerSec = prev && data.net && prev.net && dt > 0 ? (data.net.rxBytes - prev.net.rxBytes) / dt : null;
    const txPerSec = prev && data.net && prev.net && dt > 0 ? (data.net.txBytes - prev.net.txBytes) / dt : null;

    return {
      cpuPct,
      memUsed,
      memPct,
      diskUsed,
      diskPct,
      rxPerSec,
      txPerSec,
    };
  }, [data]);

  const loadText = data ? data.load.slice(0, 3).map((n) => n.toFixed(2)).join(" / ") : "—";

  return (
    <div className={cn("border border-slate-800 bg-slate-900/30 rounded-xl p-6", className)}>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Server className="h-5 w-5 text-gray-300" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Сервер</div>
            <div className="text-sm text-gray-500">Реальное время (обновление ~2 сек)</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Timer className="h-4 w-4" />
          {data ? new Date(data.at).toLocaleTimeString("ru-RU") : "—"}
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Загрузка…</div>
      ) : error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-400">CPU</div>
              <Cpu className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{computed?.cpuPct == null ? "—" : `${computed.cpuPct.toFixed(0)}%`}</div>
            <div className="text-xs text-gray-500 mt-1">Load avg: {loadText}</div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-400">Память</div>
              <Activity className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{computed?.memPct == null ? "—" : `${computed.memPct.toFixed(0)}%`}</div>
            <div className="text-xs text-gray-500 mt-1">
              {data ? `${formatBytes(computed?.memUsed ?? 0)} / ${formatBytes(data.mem.totalBytes)}` : "—"}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-400">Диск</div>
              <HardDrive className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{computed?.diskPct == null ? "—" : `${computed.diskPct.toFixed(0)}%`}</div>
            <div className="text-xs text-gray-500 mt-1">
              {data?.disk && computed?.diskUsed != null ? `${formatBytes(computed.diskUsed)} / ${formatBytes(data.disk.totalBytes)}` : "Недоступно"}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-gray-400">Сеть</div>
              <Network className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {computed?.rxPerSec == null || computed?.txPerSec == null ? "—" : `${formatBytes(computed.rxPerSec)}/с`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {computed?.rxPerSec == null || computed?.txPerSec == null ? "Недоступно" : `↑ ${formatBytes(computed.txPerSec)}/с`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

