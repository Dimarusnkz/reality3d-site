import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";

function csvEscape(value: string) {
  const v = value ?? "";
  if (v.includes('"') || v.includes(",") || v.includes("\n") || v.includes("\r")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function parseDate(raw: string | null) {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "logs.export");
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const prisma = getPrisma();
  const url = new URL(request.url);

  const report = (url.searchParams.get("report") || "").toLowerCase();
  const wRaw = parseInt(url.searchParams.get("w") || "1", 10);
  const w = Number.isFinite(wRaw) ? wRaw : 1;
  const from = parseDate(url.searchParams.get("from")) || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = parseDate(url.searchParams.get("to")) || new Date();

  const lines: string[] = [];

  if (report === "consumption") {
    const logs = await prisma.shopWarehouseLog.findMany({
      where: { warehouseId: w, actionType: "production_consume", createdAt: { gte: from, lte: to } },
      select: { createdAt: true, sku: true, productName: true, quantityDelta: true, unit: true, totalCostKopeks: true },
      take: 50000,
    });
    lines.push(["createdAt", "sku", "productName", "quantity", "unit", "totalCostRub"].join(","));
    for (const l of logs) {
      lines.push(
        [
          l.createdAt.toISOString(),
          l.sku || "",
          l.productName || "",
          String(Math.abs(Number(l.quantityDelta))),
          l.unit,
          String(((l.totalCostKopeks || 0) / 100).toFixed(2)),
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"warehouse-consumption-w${w}.csv\"`,
      },
    });
  }

  if (report === "scrap") {
    const logs = await prisma.shopWarehouseLog.findMany({
      where: { warehouseId: w, actionType: "writeoff", reason: "defect", createdAt: { gte: from, lte: to } },
      select: { createdAt: true, sku: true, productName: true, quantityDelta: true, unit: true, totalCostKopeks: true },
      take: 50000,
    });
    lines.push(["createdAt", "sku", "productName", "quantity", "unit", "totalCostRub"].join(","));
    for (const l of logs) {
      lines.push(
        [
          l.createdAt.toISOString(),
          l.sku || "",
          l.productName || "",
          String(Math.abs(Number(l.quantityDelta))),
          l.unit,
          String(((l.totalCostKopeks || 0) / 100).toFixed(2)),
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"warehouse-scrap-w${w}.csv\"`,
      },
    });
  }

  if (report === "cogs") {
    const logs = await prisma.shopWarehouseLog.findMany({
      where: { warehouseId: w, actionType: "writeoff", reason: "sale", createdAt: { gte: from, lte: to } },
      select: { createdAt: true, sku: true, productName: true, quantityDelta: true, unit: true, unitCostKopeks: true, totalCostKopeks: true, shopOrderId: true },
      take: 50000,
    });
    lines.push(["createdAt", "shopOrderId", "sku", "productName", "quantity", "unit", "unitCostRub", "totalCostRub"].join(","));
    for (const l of logs) {
      lines.push(
        [
          l.createdAt.toISOString(),
          l.shopOrderId || "",
          l.sku || "",
          l.productName || "",
          String(Math.abs(Number(l.quantityDelta))),
          l.unit,
          String(((l.unitCostKopeks || 0) / 100).toFixed(2)),
          String(((l.totalCostKopeks || 0) / 100).toFixed(2)),
        ]
          .map(csvEscape)
          .join(",")
      );
    }
    return new NextResponse(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"warehouse-cogs-w${w}.csv\"`,
      },
    });
  }

  if (report === "turnover") {
    const [logs, inventory] = await Promise.all([
      prisma.shopWarehouseLog.findMany({
        where: { warehouseId: w, actionType: "writeoff", reason: "sale", createdAt: { gte: from, lte: to }, unit: "pcs" },
        select: { productId: true, sku: true, productName: true, quantityDelta: true },
        take: 50000,
      }),
      prisma.shopInventoryItem.findMany({ where: { warehouseId: w, unit: "pcs" }, select: { productId: true, quantity: true, reserved: true }, take: 20000 }),
    ]);

    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
    const sold = new Map<number, { sku: string; name: string; qty: number }>();
    for (const l of logs) {
      if (!l.productId) continue;
      const qty = Math.abs(Number(l.quantityDelta));
      const prev = sold.get(l.productId);
      if (!prev) sold.set(l.productId, { sku: l.sku || "", name: l.productName || "", qty });
      else prev.qty += qty;
    }

    const invMap = new Map<number, { qty: number; reserved: number; free: number }>();
    for (const i of inventory) {
      const qty = Number(i.quantity);
      const reserved = Number(i.reserved);
      invMap.set(i.productId, { qty, reserved, free: Math.max(0, qty - reserved) });
    }

    lines.push(["productId", "sku", "productName", "soldQty", "currentQty", "currentFree", "turnoverDays"].join(","));
    for (const [productId, s] of sold.entries()) {
      const inv = invMap.get(productId) || { qty: 0, reserved: 0, free: 0 };
      const daily = s.qty / days;
      const turnoverDays = daily > 0 ? inv.qty / daily : "";
      lines.push(
        [String(productId), s.sku, s.name, String(s.qty), String(inv.qty), String(inv.free), turnoverDays === "" ? "" : String(Number(turnoverDays).toFixed(2))]
          .map(csvEscape)
          .join(",")
      );
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=\"warehouse-turnover-w${w}.csv\"`,
      },
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown report" }, { status: 400 });
}

