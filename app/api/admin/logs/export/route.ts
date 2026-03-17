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
  const type = (url.searchParams.get("type") || "all").toLowerCase();
  const action = (url.searchParams.get("action") || "").trim();
  const role = (url.searchParams.get("role") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  const whereTime = {
    ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
    ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
  };

  const [warehouse, client] = await Promise.all([
    type === "client"
      ? Promise.resolve([])
      : prisma.shopWarehouseLog.findMany({
          where: {
            ...(Object.keys(whereTime).length ? { createdAt: whereTime } : {}),
            ...(action ? { actionType: action } : {}),
            ...(role ? { actorRole: role } : {}),
            ...(q
              ? {
                  OR: [
                    { sku: { contains: q, mode: "insensitive" } },
                    { productName: { contains: q, mode: "insensitive" } },
                    { comment: { contains: q, mode: "insensitive" } },
                    { supplier: { contains: q, mode: "insensitive" } },
                    { documentNo: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 10000,
        }),
    type === "warehouse"
      ? Promise.resolve([])
      : prisma.shopClientLog.findMany({
          where: {
            ...(Object.keys(whereTime).length ? { createdAt: whereTime } : {}),
            ...(action ? { actionType: action } : {}),
            ...(q ? { message: { contains: q, mode: "insensitive" } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 10000,
        }),
  ]);

  const lines: string[] = [];
  lines.push(
    [
      "kind",
      "createdAt",
      "actor",
      "actionType",
      "sku",
      "productName",
      "quantityDelta",
      "unit",
      "reason",
      "shopOrderId",
      "serviceOrderId",
      "supplier",
      "documentNo",
      "comment",
      "message",
      "orderStatus",
    ].join(",")
  );

  for (const l of warehouse) {
    lines.push(
      [
        "warehouse",
        l.createdAt.toISOString(),
        l.actorRole || "",
        l.actionType,
        l.sku || "",
        l.productName || "",
        l.quantityDelta.toString(),
        l.unit,
        l.reason || "",
        l.shopOrderId || "",
        l.serviceOrderId?.toString() || "",
        l.supplier || "",
        l.documentNo || "",
        l.comment || "",
        "",
        "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  for (const l of client) {
    lines.push(
      [
        "client",
        l.createdAt.toISOString(),
        l.userId ? `client:${l.userId}` : "guest",
        l.actionType,
        "",
        "",
        l.quantity?.toString() || "",
        l.unit || "",
        "",
        l.shopOrderId || "",
        "",
        "",
        "",
        "",
        l.message || "",
        l.orderStatus || "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=\"reality3d-logs-${type}.csv\"`,
    },
  });
}
