import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const prisma = getPrisma();
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const idsRaw = Array.isArray(body?.ids) ? body?.ids : [];
  const ids = idsRaw
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0)
    .map((x) => Math.trunc(x))
    .slice(0, 200);

  if (ids.length === 0) return NextResponse.json({ ok: true, products: [] });

  const products = await prisma.shopProduct.findMany({
    where: { id: { in: ids }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      priceKopeks: true,
      stock: true,
      allowPreorder: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceKopeks: p.priceKopeks,
      stock: p.stock,
      allowPreorder: p.allowPreorder,
      imageUrl: p.images[0]?.url || null,
    })),
  });
}

