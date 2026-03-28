"use server";

import { getPrisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/access";

async function requireAnalyticsAccess() {
  const session = await getSession();
  if (!session || !["admin", "manager"].includes(session.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  const permitted = await hasPermission(parseInt(session.userId), session.role, "admin.analytics.view");
  if (!permitted && session.role !== "admin") {
    return { ok: false as const, error: "Unauthorized" };
  }
  return { ok: true as const, session };
}

export async function getCogsReport(startDate: Date, endDate: Date) {
  const access = await requireAnalyticsAccess();
  if (!access.ok) return access;

  const prisma = getPrisma();

  // Fetch successful orders within range
  const orders = await prisma.shopOrder.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ["completed", "shipped", "delivered"] },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              purchasePriceKopeks: true,
            }
          }
        }
      }
    }
  });

  let totalRevenue = 0;
  let totalCogs = 0;
  const itemsMap = new Map<number, { name: string, qty: number, revenue: number, cogs: number }>();

  for (const order of orders) {
    totalRevenue += order.totalKopeks;
    for (const item of order.items) {
      const revenue = item.totalKopeks;
      // Use purchase price from item (if we had it) or from product snapshot
      const purchasePrice = item.product?.purchasePriceKopeks || 0;
      const cogs = purchasePrice * item.quantity;
      
      totalCogs += cogs;

      if (item.productId) {
        const existing = itemsMap.get(item.productId) || { name: item.productName, qty: 0, revenue: 0, cogs: 0 };
        existing.qty += item.quantity;
        existing.revenue += revenue;
        existing.cogs += cogs;
        itemsMap.set(item.productId, existing);
      }
    }
  }

  const items = Array.from(itemsMap.entries()).map(([id, data]) => ({
    id,
    ...data,
    margin: data.revenue - data.cogs,
    marginPercent: data.revenue > 0 ? ((data.revenue - data.cogs) / data.revenue) * 100 : 0
  })).sort((a, b) => b.revenue - a.revenue);

  return {
    ok: true as const,
    totalRevenue,
    totalCogs,
    totalMargin: totalRevenue - totalCogs,
    marginPercent: totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0,
    items
  };
}

export async function getInventoryTurnoverReport() {
  const access = await requireAnalyticsAccess();
  if (!access.ok) return access;

  const prisma = getPrisma();

  // Inventory turnover = COGS / Average Inventory
  // For simplicity, we'll just show current stock vs sales in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [products, sales] = await Promise.all([
    prisma.shopProduct.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, stock: true, priceKopeks: true }
    }),
    prisma.shopOrderItem.groupBy({
      by: ['productId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        order: { status: { in: ["completed", "shipped", "delivered"] } }
      },
      _sum: { quantity: true }
    })
  ]);

  const salesMap = new Map(sales.map(s => [s.productId, s._sum.quantity || 0]));

  const report = products.map(p => {
    const soldQty = salesMap.get(p.id) || 0;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: p.stock,
      soldLast30Days: soldQty,
      daysOfStock: soldQty > 0 ? Math.round((p.stock / (soldQty / 30))) : (p.stock > 0 ? 999 : 0)
    };
  }).sort((a, b) => a.daysOfStock - b.daysOfStock);

  return { ok: true as const, report };
}
