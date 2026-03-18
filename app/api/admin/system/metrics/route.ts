import { NextResponse } from "next/server";
import os from "node:os";
import fs from "node:fs/promises";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CpuSnapshot = { idle: number; total: number };

function getCpuSnapshot(): CpuSnapshot {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const c of cpus) {
    const t = c.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.irq + t.idle;
  }
  return { idle, total };
}

async function getDiskSnapshot() {
  const platform = process.platform;
  const path = platform === "win32" ? `${process.cwd().slice(0, 2)}\\` : "/";
  try {
    const stat = await fs.statfs(path);
    const total = stat.bsize * stat.blocks;
    const free = stat.bsize * stat.bavail;
    return { totalBytes: total, freeBytes: free };
  } catch {
    return null;
  }
}

async function getNetSnapshot() {
  if (process.platform !== "linux") return null;
  try {
    const text = await fs.readFile("/proc/net/dev", "utf8");
    const lines = text.split("\n").slice(2);
    let rx = 0;
    let tx = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const [iface, rest] = trimmed.split(":");
      if (!rest) continue;
      const cols = rest.trim().split(/\s+/);
      const rxBytes = Number(cols[0] || 0);
      const txBytes = Number(cols[8] || 0);
      if (Number.isFinite(rxBytes)) rx += rxBytes;
      if (Number.isFinite(txBytes)) tx += txBytes;
    }
    return { rxBytes: rx, txBytes: tx };
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId || session.role !== "admin") {
    return NextResponse.json({ ok: false as const }, { status: 403 });
  }

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const cpu = getCpuSnapshot();
  const load = os.loadavg();

  const [disk, net] = await Promise.all([getDiskSnapshot(), getNetSnapshot()]);

  return NextResponse.json(
    {
      ok: true as const,
      at: Date.now(),
      load,
      cpu,
      mem: { totalBytes: memTotal, freeBytes: memFree },
      disk,
      net,
    },
    { headers: { "cache-control": "no-store" } }
  );
}

