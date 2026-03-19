import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { getCalcOrderStatusMeta } from "@/lib/orders/calc-order-status";
import { OrderLayout, OrderSection, OrderInfoRow } from "@/components/order/order-layout";
import { Badge } from "@/components/ui/badge";

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) redirect(`/login?redirectTo=/lk/orders`);

  const { id } = await params;
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) notFound();

  const prisma = getPrisma();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.userId !== parseInt(session.userId, 10)) {
    notFound();
  }

  const statusMeta = getCalcOrderStatusMeta(order.status);
  
  let details: any = {};
  try {
    details = JSON.parse(order.details || "{}");
  } catch (e) {
    details = { description: order.details };
  }

  const files = details.files || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <OrderLayout
        title={`Заказ 3D-печати #${order.id}`}
        subtitle={`Создан ${order.createdAt.toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        backUrl="/lk/orders"
        backLabel="К списку заказов"
        statusBadge={<Badge className={statusMeta.className}>{statusMeta.label}</Badge>}
        mainContent={
          <div className="space-y-6">
            <OrderSection title="Детали заказа">
              <div className="text-white mb-2 font-medium">{order.title}</div>
              {details.description && (
                <div className="text-gray-300 whitespace-pre-wrap text-sm">
                  {details.description}
                </div>
              )}
              
              {details.mode === "file" && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Технология:</span> <span className="text-white">{details.tech?.toUpperCase() || "—"}</span></div>
                  <div><span className="text-gray-500">Материал:</span> <span className="text-white">{details.material?.toUpperCase() || "—"}</span></div>
                  <div><span className="text-gray-500">Заполнение:</span> <span className="text-white">{details.infill || "—"}</span></div>
                  <div><span className="text-gray-500">Слой:</span> <span className="text-white">{details.layerHeight || "—"}</span></div>
                  <div><span className="text-gray-500">Количество:</span> <span className="text-white">{details.count || 1} шт.</span></div>
                </div>
              )}

              {details.mode === "manual" && details.manualParams && (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Объем (см³):</span> <span className="text-white">{details.manualParams.volume || "—"}</span></div>
                  <div><span className="text-gray-500">Время (ч):</span> <span className="text-white">{details.manualParams.time || "—"}</span></div>
                  <div><span className="text-gray-500">Технология:</span> <span className="text-white">{details.manualParams.tech?.toUpperCase() || "—"}</span></div>
                  <div><span className="text-gray-500">Материал:</span> <span className="text-white">{details.manualParams.material?.toUpperCase() || "—"}</span></div>
                  <div><span className="text-gray-500">Количество:</span> <span className="text-white">{details.count || 1} шт.</span></div>
                </div>
              )}
            </OrderSection>

            {files.length > 0 && (
              <OrderSection title="Прикрепленные файлы">
                <div className="space-y-2">
                  {files.map((file: any, idx: number) => (
                    <a 
                      key={idx}
                      href={`/api/files/${file.fileName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:border-primary/50 transition-colors group"
                    >
                      <div className="bg-primary/10 p-2 rounded">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-gray-200 truncate group-hover:text-white">{file.originalName}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </a>
                  ))}
                </div>
              </OrderSection>
            )}
          </div>
        }
        sidebarContent={
          <div className="space-y-6">
            <OrderSection title="Стоимость">
              <div className="text-3xl font-bold text-white mb-1">
                {order.price > 0 ? `${order.price} ₽` : 'На расчете'}
              </div>
              <p className="text-sm text-gray-400">
                {order.price > 0 ? 'Ожидает оплаты' : 'Менеджер рассчитывает стоимость заказа'}
              </p>
            </OrderSection>

            <OrderSection title="Поддержка">
              <p className="text-sm text-gray-400 mb-4">
                Если у вас есть вопросы по заказу, вы можете связаться с нами.
              </p>
              <a 
                href="https://t.me/reality3d" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-lg bg-[#2AABEE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#229ED9] transition-colors"
              >
                Написать в Telegram
              </a>
            </OrderSection>
          </div>
        }
      />
    </div>
  );
}