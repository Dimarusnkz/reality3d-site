import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
 
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const token = url.searchParams.get("token");
 
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
 
  const prisma = getPrisma();
  const order = await prisma.shopOrder.findUnique({
    where: { id },
    select: { id: true, userId: true, publicAccessToken: true, status: true, paymentStatus: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
 
  const session = await getSession();
  const isGuest = !session?.userId;
 
  if (isGuest) {
    if (order.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!token || !order.publicAccessToken || token !== order.publicAccessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const userId = parseInt(session.userId, 10);
    if (order.userId !== userId && session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
 
  const paid = order.paymentStatus === "paid" || order.status === "paid";
  return NextResponse.json({ paid, status: order.status, paymentStatus: order.paymentStatus });
}

