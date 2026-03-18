"use client";

import { useMemo, useState } from "react";
import { createShopOrder, startTbankPayment } from "@/app/actions/shop";
import { formatRub } from "@/lib/shop/money";
import { PICKUP_ADDRESS, PICKUP_PHONE, ShippingMethod, calcShippingCostKopeks } from "@/lib/shop/shipping";
import { Loader2 } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type CheckoutItem = { name: string; quantity: number; unitPriceKopeks: number };

export function CheckoutClient({
  items,
  initial,
}: {
  items: CheckoutItem[];
  initial?: { contactName?: string; contactPhone?: string; contactEmail?: string; deliveryAddress?: string; deliveryPhone?: string };
}) {
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("pickup");
  const [paymentProvider, setPaymentProvider] = useState<"tbank" | "yookassa" | "sber_online" | "tinkoff_online">(
    "tbank"
  );
  const [contactName, setContactName] = useState(initial?.contactName || "");
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone || "");
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail || "");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(initial?.deliveryAddress || "");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState(initial?.deliveryPhone || initial?.contactPhone || "");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceKopeks * i.quantity, 0),
    [items]
  );
  const shippingCost = useMemo(() => calcShippingCostKopeks(shippingMethod), [shippingMethod]);
  const total = subtotal + shippingCost;

  const PHONE_RE = /^\+7\d{10}$/;
  const NAME_RE = /^[A-Za-zА-Яа-яЁё\s\-]{2,50}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const isValidName = NAME_RE.test(contactName.trim());
  const isValidPhone = PHONE_RE.test(contactPhone.trim());
  const isValidEmail = contactEmail.trim().length <= 100 && EMAIL_RE.test(contactEmail.trim());
  const isValidDeliveryPhone = shippingMethod === "pickup" ? true : PHONE_RE.test(deliveryPhone.trim());
  const isValidComment = comment.length <= 200;
  const isValidDelivery =
    shippingMethod === "pickup" ? true : deliveryCity.trim().length > 0 && deliveryAddress.trim().length > 0 && isValidDeliveryPhone;

  const canSubmit = isValidName && isValidPhone && isValidEmail && isValidComment && isValidDelivery;

  const submit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const res = await createShopOrder({
        shippingMethod,
        paymentProvider,
        contactName,
        contactPhone,
        contactEmail,
        deliveryPhone: shippingMethod === "pickup" ? undefined : deliveryPhone,
        deliveryCity: shippingMethod === "pickup" ? undefined : deliveryCity,
        deliveryAddress: shippingMethod === "pickup" ? undefined : deliveryAddress,
        deliveryPostalCode: shippingMethod === "pickup" ? undefined : deliveryPostalCode,
        comment,
        csrfToken: getCsrfToken(),
      });
      if (!res.ok) {
        alert(res.error || "Не удалось создать заказ");
        return;
      }

      if (paymentProvider === "tbank") {
        const p = await startTbankPayment(res.orderId, getCsrfToken());
        if (!p.ok) {
          alert(p.error || "Не удалось создать оплату");
          window.location.href = `/shop/order/${res.orderId}`;
          return;
        }
        window.location.href = p.paymentUrl;
        return;
      }

      window.location.href = `/shop/order/${res.orderId}`;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7 space-y-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Контакты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Имя</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={`w-full bg-slate-950 border ${isValidName ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40`}
                placeholder="Иван"
                maxLength={50}
                inputMode="text"
              />
              {!isValidName ? <div className="text-xs text-red-400 mt-1">Только буквы (латиница/кириллица), 2–50 символов</div> : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Телефон</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className={`w-full bg-slate-950 border ${isValidPhone ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40`}
                placeholder="+79000000000"
                inputMode="tel"
                pattern="^\+7\d{10}$"
                maxLength={12}
              />
              {!isValidPhone ? <div className="text-xs text-red-400 mt-1">Формат: +7XXXXXXXXXX</div> : null}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={`w-full bg-slate-950 border ${isValidEmail ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40`}
                placeholder="mail@example.com"
                inputMode="email"
                maxLength={100}
              />
              {!isValidEmail ? <div className="text-xs text-red-400 mt-1">Неверный email (макс. 100 символов)</div> : null}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Доставка</h2>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="shipping"
                checked={shippingMethod === "pickup"}
                onChange={() => setShippingMethod("pickup")}
              />
              <div>
                <div className="text-white font-medium">Самовывоз</div>
                <div className="text-sm text-gray-400">{PICKUP_ADDRESS}</div>
                <div className="text-xs text-gray-500 mt-1">При прибытии звонить: {PICKUP_PHONE}</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="shipping"
                checked={shippingMethod === "courier_spb"}
                onChange={() => setShippingMethod("courier_spb")}
              />
              <div>
                <div className="text-white font-medium">Курьер по СПб</div>
                <div className="text-sm text-gray-400">399 ₽, 1–2 дня (в пределах КАД)</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="shipping"
                checked={shippingMethod === "russian_post"}
                onChange={() => setShippingMethod("russian_post")}
              />
              <div>
                <div className="text-white font-medium">Почта России</div>
                <div className="text-sm text-gray-400">от 299 ₽, 3–10 дней (по РФ)</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="shipping"
                checked={shippingMethod === "cdek"}
                onChange={() => setShippingMethod("cdek")}
              />
              <div>
                <div className="text-white font-medium">СДЭК</div>
                <div className="text-sm text-gray-400">стоимость уточним после оформления</div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="shipping"
                checked={shippingMethod === "yandex"}
                onChange={() => setShippingMethod("yandex")}
              />
              <div>
                <div className="text-white font-medium">Яндекс Доставка</div>
                <div className="text-sm text-gray-400">стоимость уточним после оформления</div>
              </div>
            </label>
          </div>

          {shippingMethod !== "pickup" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Город</label>
                <input
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Индекс</label>
                <input
                  value={deliveryPostalCode}
                  onChange={(e) => setDeliveryPostalCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  maxLength={12}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Телефон для доставки</label>
                <input
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  className={`w-full bg-slate-950 border ${isValidDeliveryPhone ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40`}
                  placeholder="+79000000000"
                  inputMode="tel"
                  pattern="^\+7\d{10}$"
                  maxLength={12}
                />
                {!isValidDeliveryPhone && shippingMethod !== "pickup" ? (
                  <div className="text-xs text-red-400 mt-1">Формат: +7XXXXXXXXXX</div>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Адрес</label>
                <input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Улица, дом, квартира / ПВЗ"
                  maxLength={200}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Оплата</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={paymentProvider === "tbank"} onChange={() => setPaymentProvider("tbank")} />
              <div className="text-white">Тинькофф Банк (ТБанк) — безопасная страница оплаты</div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={paymentProvider === "yookassa"}
                onChange={() => setPaymentProvider("yookassa")}
              />
              <div className="text-white">ЮKassa (СБП, карта)</div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={paymentProvider === "sber_online"}
                onChange={() => setPaymentProvider("sber_online")}
              />
              <div className="text-white">Сбербанк Онлайн</div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                checked={paymentProvider === "tinkoff_online"}
                onChange={() => setPaymentProvider("tinkoff_online")}
              />
              <div className="text-white">Тинькофф Онлайн</div>
            </label>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">Комментарий</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`w-full bg-slate-950 border ${isValidComment ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[100px]`}
            placeholder="Например: позвонить за 30 минут до доставки"
            maxLength={200}
          />
          {!isValidComment ? <div className="text-xs text-red-400 mt-1">Комментарий не более 200 символов</div> : null}
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-5 sticky top-24">
          <h2 className="text-lg font-semibold text-white">Итог</h2>
          <div className="space-y-2">
            {items.map((i, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 text-sm">
                <div className="text-gray-300">
                  {i.name} <span className="text-gray-500">× {i.quantity}</span>
                </div>
                <div className="text-white font-medium">{formatRub(i.unitPriceKopeks * i.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Товары</span>
              <span className="text-white">{formatRub(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Доставка</span>
              <span className="text-white">
                {shippingMethod === "cdek" || shippingMethod === "yandex" ? "по тарифу" : formatRub(shippingCost)}
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-bold">
              <span className="text-white">Итого</span>
              <span className="text-white">{formatRub(total)}</span>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit || isLoading}
            className="w-full h-11 rounded-lg bg-primary text-white font-semibold shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Перейти к оплате
          </button>

          <div className="text-xs text-gray-500">
            При выборе ТБанк будет редирект на защищённую страницу оплаты (не iframe).
          </div>
        </div>
      </div>
    </div>
  );
}
