import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/access";
import { getShippingMethodLabel } from "@/lib/shop/shipping";

function csvEscape(value: string) {
  const v = value ?? "";
  if (v.includes('"') || v.includes(",") || v.includes("\n") || v.includes("\r")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ ok: false }, { status: 401 });
  const allowed = await hasPermission(parseInt(session.userId, 10), session.role, "shop.orders.export");
  if (!allowed) return NextResponse.json({ ok: false }, { status: 401 });

  const prisma = getPrisma();
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = (url.searchParams.get("status") || "").trim();

  const orders = await prisma.shopOrder.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { contactPhone: { contains: q } },
              { contactEmail: { contains: q, mode: "insensitive" } },
              { deliveryPhone: { contains: q } },
              { deliveryAddress: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  const lines: string[] = [];
  lines.push(["orderNo", "createdAt", "status", "paymentStatus", "shipping", "city", "phone", "totalRub"].join(","));
  for (const o of orders) {
    lines.push(
      [
        String(o.orderNo),
        o.createdAt.toISOString(),
        o.status,
        o.paymentStatus,
        getShippingMethodLabel(o.shippingMethod),
        o.deliveryCity || "",
        o.deliveryPhone || o.contactPhone || "",
        String((o.totalKopeks / 100).toFixed(2)),
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=\"shop-orders.csv\"`,
    },
  });
}

