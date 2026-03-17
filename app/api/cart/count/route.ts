import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ ok: true, items: 0, quantity: 0 });
  }

  const prisma = getPrisma();
  const userId = parseInt(session.userId, 10);

  const cart = await prisma.shopCart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) return NextResponse.json({ ok: true, items: 0, quantity: 0 });

  const [itemsCount, qtyAgg] = await Promise.all([
    prisma.shopCartItem.count({ where: { cartId: cart.id } }),
    prisma.shopCartItem.aggregate({ where: { cartId: cart.id }, _sum: { quantity: true } }),
  ]);

  return NextResponse.json({ ok: true, items: itemsCount, quantity: qtyAgg._sum.quantity ?? 0 });
}

