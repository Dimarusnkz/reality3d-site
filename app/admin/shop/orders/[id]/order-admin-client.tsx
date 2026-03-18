"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { updateShopOrderAdmin } from "@/app/actions/shop-orders-admin";
import { Loader2, Save } from "lucide-react";
import { formatRub } from "@/lib/shop/money";
import { getShippingMethodLabel } from "@/lib/shop/shipping";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function OrderAdminClient({
  order,
  audit,
}: {
  order: {
    id: string;
    orderNo: number;
    createdAt: string;
    status: string;
    paymentStatus: string;
    paymentProvider: string | null;
    totalKopeks: number;
    shippingMethod: string;
    shippingCarrier: string | null;
    shippingStatus: string | null;
    shippingTrackingNo: string | null;
    shippingCostFinalKopeks: number | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    deliveryCity: string | null;
    deliveryAddress: string | null;
    deliveryPhone: string | null;
    comment: string | null;
    items: { id: string; productName: string; sku: string | null; quantity: number; unitPriceKopeks: number; totalKopeks: number }[];
  };
  audit: { id: string; createdAt: string; action: string; actorUserId: number | null }[];
}) {
  const [form, setForm] = useState({
    status: order.status,
    shippingStatus: order.shippingStatus || "new",
    shippingCarrier: order.shippingCarrier || order.shippingMethod,
    shippingTrackingNo: order.shippingTrackingNo || "",
    shippingCostFinalRub: order.shippingCostFinalKopeks == null ? "" : String((order.shippingCostFinalKopeks / 100).toFixed(2)),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const itemsTotal = useMemo(() => order.items.reduce((s, i) => s + i.totalKopeks, 0), [order.items]);

  const save = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const costKopeks = form.shippingCostFinalRub.trim()
        ? Math.max(0, Math.round(Number(form.shippingCostFinalRub.replace(",", ".")) * 100))
        : null;
      if (form.shippingCostFinalRub.trim() && !Number.isFinite(costKopeks as any)) {
        setError("Некорректная стоимость доставки");
        return;
      }

      const res = await updateShopOrderAdmin(
        order.id,
        {
          status: form.status,
          shippingStatus: form.shippingStatus,
          shippingCarrier: form.shippingCarrier,
          shippingTrackingNo: form.shippingTrackingNo || null,
          shippingCostFinalKopeks: costKopeks,
        },
        getCsrfToken()
      );
      if (!res.ok) {
        setError(res.error || "Ошибка");
        return;
      }
      setSuccess("Сохранено");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Заказ #{order.orderNo}</h1>
          <div className="text-sm text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/shop/orders" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors">
            Назад
          </Link>
          <button onClick={save} disabled={busy} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить
          </button>
        </div>
      </div>

      {error ? <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">{error}</div> : null}
      {success ? <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4">{success}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Состав</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
                <tr>
                  <th className="p-4 text-left font-medium">Товар</th>
                  <th className="p-4 text-right font-medium">Кол-во</th>
                  <th className="p-4 text-right font-medium">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {order.items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="text-white font-medium">{i.productName}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{i.sku || "—"}</div>
                    </td>
                    <td className="p-4 text-right text-gray-200">{i.quantity}</td>
                    <td className="p-4 text-right text-white font-semibold">{formatRub(i.totalKopeks)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-sm">
              <div className="text-gray-400">Товары</div>
              <div className="text-white font-semibold">{formatRub(itemsTotal)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="text-white font-semibold">Контакты</div>
            <div className="text-sm text-gray-300">{order.contactName || "—"}</div>
            <div className="text-sm text-gray-300">{order.contactPhone || "—"}</div>
            <div className="text-sm text-gray-300">{order.contactEmail || "—"}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="text-white font-semibold">Доставка</div>
            <div className="text-sm text-gray-300">{getShippingMethodLabel(order.shippingMethod as any)}</div>
            <div className="text-sm text-gray-300">{order.deliveryCity || "—"}</div>
            <div className="text-sm text-gray-300">{order.deliveryAddress || "—"}</div>
            <div className="text-sm text-gray-300">{order.deliveryPhone || order.contactPhone || "—"}</div>
          </div>

          {order.comment ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-2">
              <div className="text-white font-semibold">Комментарий</div>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">{order.comment}</pre>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="text-white font-semibold">Статусы</div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Статус заказа</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white">
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="shipped">shipped</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Оплата</label>
                <div className="text-white font-medium">{order.paymentStatus}</div>
                <div className="text-xs text-gray-500">{order.paymentProvider || "—"}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Статус доставки</label>
                <select value={form.shippingStatus} onChange={(e) => setForm((p) => ({ ...p, shippingStatus: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white">
                  <option value="new">new</option>
                  <option value="quoted">quoted</option>
                  <option value="packed">packed</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Служба доставки</label>
                <input value={form.shippingCarrier} onChange={(e) => setForm((p) => ({ ...p, shippingCarrier: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Трек-номер</label>
                <input value={form.shippingTrackingNo} onChange={(e) => setForm((p) => ({ ...p, shippingTrackingNo: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" maxLength={120} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Стоимость доставки (₽)</label>
                <input value={form.shippingCostFinalRub} onChange={(e) => setForm((p) => ({ ...p, shippingCostFinalRub: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="text-white font-semibold">Итого</div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-400">Сумма заказа</div>
              <div className="text-white font-semibold">{formatRub(order.totalKopeks)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <div className="text-white font-semibold">История</div>
            <div className="space-y-2 text-sm">
              {audit.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3">
                  <div className="text-gray-300">{a.action}</div>
                  <div className="text-gray-500 whitespace-nowrap">{new Date(a.createdAt).toLocaleString("ru-RU")}</div>
                </div>
              ))}
              {audit.length === 0 ? <div className="text-gray-500">Нет событий</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

