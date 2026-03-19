import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Package, Calculator, ShoppingCart } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { formatRub } from "@/lib/shop/money";
import { getCalcOrderStatusMeta } from "@/lib/orders/calc-order-status";
import { getShopOrderStatusMeta, getShopPaymentStatusMeta } from "@/lib/shop/order-status";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";

export default async function LkDashboard() {
  const session = await getSession();
  if (!session?.userId) redirect("/login?redirectTo=/lk");

  const prisma = getPrisma();
  const userId = parseInt(session.userId, 10);

  const [user, shopActiveCount, calcActiveCount, recentShop, recentCalc] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    prisma.shopOrder.count({ where: { userId, status: { notIn: ["completed", "cancelled"] } } }),
    prisma.order.count({ where: { userId, status: { notIn: ["completed", "cancelled"] } } }),
    prisma.shopOrder.findMany({
      where: { userId },
      select: { id: true, orderNo: true, createdAt: true, status: true, paymentStatus: true, totalKopeks: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.order.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true, status: true, price: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const items = [
    ...recentShop.map((o) => ({ kind: "shop" as const, createdAt: o.createdAt, data: o })),
    ...recentCalc.map((o) => ({ kind: "calc" as const, createdAt: o.createdAt, data: o })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const name = user?.name || "Пользователь";

  return (
    <div className="space-y-8">
      <div className="neon-card p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Личный кабинет, {name}</h1>
          <p className="text-gray-400 mt-1">Быстрые действия и статусы заказов</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/calculator" size="sm">
            Рассчитать 3D‑печать
          </LinkButton>
          <LinkButton href="/lk/orders" variant="outline" size="sm">
            Мои заказы
          </LinkButton>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/calculator" className="neon-card p-5 rounded-xl border border-slate-800 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold">Калькулятор</div>
              <div className="text-sm text-gray-400 truncate">Рассчитать и создать заказ</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-500" />
          </div>
        </Link>

        <Link href="/shop" className="neon-card p-5 rounded-xl border border-slate-800 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold">Магазин</div>
              <div className="text-sm text-gray-400 truncate">Товары в наличии</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-500" />
          </div>
        </Link>

        <Link href="/lk/orders" className="neon-card p-5 rounded-xl border border-slate-800 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold">Заказы</div>
              <div className="text-sm text-gray-400 truncate">3D‑печать и магазин</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-500" />
          </div>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neon-card p-5 rounded-xl">
          <div className="text-2xl font-bold text-primary">{calcActiveCount}</div>
          <div className="text-sm text-gray-400 mt-1">Активных заказов 3D‑печати</div>
        </div>
        <div className="neon-card p-5 rounded-xl">
          <div className="text-2xl font-bold text-primary">{shopActiveCount}</div>
          <div className="text-sm text-gray-400 mt-1">Активных заказов магазина</div>
        </div>
        <div className="neon-card p-5 rounded-xl">
          <div className="text-2xl font-bold text-primary">{user?.email ? "✓" : "—"}</div>
          <div className="text-sm text-gray-400 mt-1">Контакты заполнены</div>
        </div>
        <div className="neon-card p-5 rounded-xl">
          <div className="text-2xl font-bold text-primary">+</div>
          <div className="text-sm text-gray-400 mt-1">Создать новый заказ</div>
          <div className="mt-3">
            <LinkButton href="/calculator" variant="secondary" size="sm">
              В калькулятор
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Последняя активность</h2>
          <Link href="/lk/orders" className="text-sm text-primary hover:underline flex items-center">
            Все заказы <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="neon-card rounded-xl overflow-hidden">
          {items.length === 0 ? (
            <div className="p-6 text-gray-400">
              <div>Пока нет заказов.</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <LinkButton href="/calculator" size="sm">
                  Создать заказ 3D‑печати
                </LinkButton>
                <LinkButton href="/shop" variant="outline" size="sm">
                  Перейти в магазин
                </LinkButton>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {items.map((it) => {
                if (it.kind === "shop") {
                  const o = it.data;
                  const s = getShopOrderStatusMeta(o.status);
                  const p = getShopPaymentStatusMeta(o.paymentStatus);
                  return (
                    <div key={`shop:${o.id}`} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">
                          <Link href={`/shop/order/${o.id}`} className="hover:underline">
                            Заказ магазина #{o.orderNo}
                          </Link>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{o.createdAt.toLocaleString("ru-RU")}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={cn("border", p.className)}>{p.label}</Badge>
                        <Badge className={cn("border", s.className)}>{s.label}</Badge>
                        <div className="text-white font-semibold md:ml-2">{formatRub(o.totalKopeks)}</div>
                      </div>
                    </div>
                  );
                }

                const o = it.data;
                const s = getCalcOrderStatusMeta(o.status);
                return (
                  <div key={`calc:${o.id}`} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-white font-semibold">
                        <Link href="/lk/orders" className="hover:underline">
                          Заказ 3D‑печати #{o.id}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-300 truncate">{o.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{o.createdAt.toLocaleString("ru-RU")}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("border", s.className)}>{s.label}</Badge>
                      <div className="text-white font-semibold md:ml-2">{o.price > 0 ? `${o.price.toLocaleString("ru-RU")} ₽` : "На расчёте"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
