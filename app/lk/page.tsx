import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  ArrowRight, 
  Package, 
  Calculator, 
  ShoppingCart, 
  Upload, 
  MessageSquare, 
  LifeBuoy,
  CreditCard,
  FileText,
  Clock
} from "lucide-react";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { formatRub } from "@/lib/shop/money";
import { getCalcOrderStatusMeta } from "@/lib/orders/calc-order-status";
import { getShopOrderStatusMeta, getShopPaymentStatusMeta } from "@/lib/shop/order-status";
import { Badge } from "@/components/ui/badge";
import { LinkButton, Button } from "@/components/ui/button";

export default async function LkDashboard() {
  const session = await getSession();
  if (!session?.userId) redirect("/login?redirectTo=/lk");

  const prisma = getPrisma();
  const userId = parseInt(session.userId, 10);

  const [user, shopActiveCount, calcActiveCount, activeShopOrders, activeCalcOrders] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
    prisma.shopOrder.count({ where: { userId, status: { notIn: ["completed", "cancelled"] } } }),
    prisma.order.count({ where: { userId, status: { notIn: ["completed", "cancelled"] } } }),
    prisma.shopOrder.findMany({
      where: { userId, status: { notIn: ["completed", "cancelled"] } },
      select: { id: true, orderNo: true, createdAt: true, status: true, paymentStatus: true, totalKopeks: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.order.findMany({
      where: { userId, status: { notIn: ["completed", "cancelled"] } },
      select: { id: true, title: true, createdAt: true, status: true, price: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const activeItems = [
    ...activeShopOrders.map((o) => ({ kind: "shop" as const, createdAt: o.createdAt, data: o })),
    ...activeCalcOrders.map((o) => ({ kind: "calc" as const, createdAt: o.createdAt, data: o })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  const activeTotalCount = shopActiveCount + calcActiveCount;

  const name = user?.name || "Пользователь";

  return (
    <div className="space-y-8">
      {/* Приветствие */}
      <div className="neon-card p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Привет, {name}!
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Добро пожаловать в ваш кабинет Reality3D
          </p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10">
          <LinkButton href="/calculator" size="lg" className="shadow-lg shadow-primary/20">
            <Calculator className="mr-2 h-5 w-5" />
            Рассчитать печать
          </LinkButton>
          <LinkButton href="/shop" variant="secondary" size="lg">
            <ShoppingCart className="mr-2 h-5 w-5" />
            В магазин
          </LinkButton>
        </div>
        {/* Декоративный элемент фона */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Левая колонка: Активные заказы */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Активные заказы
            </h2>
            <Link href="/lk/orders" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium flex items-center">
              Все заказы ({activeTotalCount}) <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {activeItems.length === 0 ? (
              <div className="neon-card rounded-2xl p-10 text-center border-dashed border-slate-800 bg-slate-900/20">
                <Package className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">У вас пока нет активных заказов</p>
                <LinkButton href="/calculator" variant="outline" size="sm" className="mt-4">
                  Начать первый проект
                </LinkButton>
              </div>
            ) : (
              activeItems.map((it) => {
                if (it.kind === "shop") {
                  const o = it.data;
                  const s = getShopOrderStatusMeta(o.status);
                  const p = getShopPaymentStatusMeta(o.paymentStatus);
                  return (
                    <div key={`shop:${o.id}`} className="neon-card p-5 rounded-2xl border border-slate-800/50 hover:border-primary/30 transition-all group">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center shrink-0 border border-slate-700/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                            <ShoppingCart className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <div className="text-white font-bold text-lg">
                              <Link href={`/shop/order/${o.id}`} className="hover:text-primary transition-colors">
                                Заказ магазина #{o.orderNo}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">{o.createdAt.toLocaleDateString("ru-RU")}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant={o.paymentStatus === "paid" ? "success" : "warning"}>{p.label}</Badge>
                          <Badge variant="info">{s.label}</Badge>
                          <div className="text-white font-bold text-lg md:ml-4">{formatRub(o.totalKopeks)}</div>
                          <LinkButton href={`/shop/order/${o.id}`} variant="outline" size="sm" className="ml-2">
                            Открыть
                          </LinkButton>
                        </div>
                      </div>
                    </div>
                  );
                }

                const o = it.data;
                const s = getCalcOrderStatusMeta(o.status);
                return (
                  <div key={`calc:${o.id}`} className="neon-card p-5 rounded-2xl border border-slate-800/50 hover:border-primary/30 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center shrink-0 border border-slate-700/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                          <Calculator className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-bold text-lg truncate max-w-[240px]">
                            <Link href={`/lk/orders/${o.id}`} className="hover:text-primary transition-colors">
                              {o.title || `Заказ #${o.id}`}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">{o.createdAt.toLocaleDateString("ru-RU")}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="info">{s.label}</Badge>
                        <div className="text-white font-bold text-lg md:ml-4">
                          {o.price && o.price > 0 ? `${o.price.toLocaleString("ru-RU")} ₽` : "На расчёте"}
                        </div>
                        <LinkButton href={`/lk/orders/${o.id}`} variant="outline" size="sm" className="ml-2">
                          Детали
                        </LinkButton>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Быстрые блоки действий */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/lk/files" className="neon-card p-6 rounded-2xl border border-slate-800 hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-white font-bold">Загрузить файлы</div>
                  <div className="text-sm text-gray-400 mt-0.5">STL, STEP, OBJ модели</div>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link href="/lk/orders?action=new" className="neon-card p-6 rounded-2xl border border-slate-800 hover:border-primary/40 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-bold">Создать проект</div>
                  <div className="text-sm text-gray-400 mt-0.5">Индивидуальный заказ</div>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </div>
        </div>

        {/* Правая колонка: Инфо и Поддержка */}
        <div className="space-y-6">
          {/* Блок Менеджера */}
          <div className="neon-card p-6 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-800/20">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              Ваш менеджер
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-primary">
                R
              </div>
              <div>
                <div className="text-white font-bold">Reality3D Support</div>
                <div className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  В сети
                </div>
              </div>
            </div>
            <LinkButton href="/lk/chat" className="w-full" variant="secondary">
              Написать в чат
            </LinkButton>
            <div className="mt-4 text-xs text-gray-500 text-center">
              Среднее время ответа: 15 минут
            </div>
          </div>

          {/* Справочник статусов */}
          <div className="neon-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <LifeBuoy className="h-5 w-5 text-blue-400" />
              Статусы заказов
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="warning" className="mt-0.5">В обработке</Badge>
                <div className="text-xs text-gray-400 leading-snug">Менеджер проверяет файлы и параметры печати</div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="error" className="mt-0.5">Ждёт оплаты</Badge>
                <div className="text-xs text-gray-400 leading-snug">Заказ подтвержден, необходимо внести оплату</div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="info" className="mt-0.5">В работе</Badge>
                <div className="text-xs text-gray-400 leading-snug">Заказ передан в производство или комплектуется</div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="success" className="mt-0.5">Готов</Badge>
                <div className="text-xs text-gray-400 leading-snug">Можно забирать или заказ передан в доставку</div>
              </div>
            </div>
          </div>

          {/* Быстрые ссылки */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/lk/settings" className="neon-card p-4 rounded-xl border border-slate-800 hover:bg-slate-800/30 transition-colors text-center">
              <div className="text-gray-400 text-xs font-medium">Профиль</div>
            </Link>
            <Link href="/lk/orders" className="neon-card p-4 rounded-xl border border-slate-800 hover:bg-slate-800/30 transition-colors text-center">
              <div className="text-gray-400 text-xs font-medium">История</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
