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

  const auditCategoryPrefix =
    type === "finance"
      ? "finance."
      : type === "shop"
        ? "shop."
        : type === "roles"
          ? null
          : type === "staff"
            ? "orders."
            : type === "security"
              ? "sessions."
              : null;

  const [warehouse, client, audit] = await Promise.all([
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
    type === "warehouse" || type === "client"
      ? Promise.resolve([])
      : prisma.auditEvent.findMany({
          where: {
            ...(Object.keys(whereTime).length ? { createdAt: whereTime } : {}),
            ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
            ...(role ? { actor: { is: { role } } } : {}),
            ...(type === "roles"
              ? {
                  OR: [
                    { action: { startsWith: "access." } },
                    { action: { startsWith: "roles." } },
                  ],
                }
              : auditCategoryPrefix
                ? { action: { startsWith: auditCategoryPrefix } }
                : {}),
            ...(q
              ? {
                  OR: [
                    { action: { contains: q, mode: "insensitive" } },
                    { target: { contains: q, mode: "insensitive" } },
                    { metadata: { contains: q, mode: "insensitive" } },
                    { actor: { is: { email: { contains: q, mode: "insensitive" } } } },
                  ],
                }
              : {}),
          },
          include: { actor: { select: { id: true, email: true, role: true } } },
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
      "auditTarget",
      "auditMetadata",
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

  for (const e of audit) {
    lines.push(
      [
        "audit",
        e.createdAt.toISOString(),
        e.actor ? `${e.actor.role}:${e.actor.id}` : "system",
        e.action,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        e.target || "",
        e.metadata || "",
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
