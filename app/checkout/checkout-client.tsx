"use client";

import { useEffect, useMemo, useState } from "react";
import { createGuestShopOrder, createShopOrder, startTbankPayment, startTbankPaymentPublic } from "@/app/actions/shop";
import { formatRub } from "@/lib/shop/money";
import { PICKUP_ADDRESS, PICKUP_PHONE, ShippingMethod, calcShippingCostKopeks } from "@/lib/shop/shipping";
import { Loader2 } from "lucide-react";
import { guestCartClear, guestCartRead } from "@/lib/shop/guest-cart";

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
  isAuthenticated = true,
}: {
  items: CheckoutItem[];
  initial?: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    deliveryCity?: string;
    deliveryAddress?: string;
    deliveryPhone?: string;
  };
  isAuthenticated?: boolean;
}) {
  const normalizePhone = (input: string) => {
    const raw = input.trim();
    const digits = raw.replace(/[^\d+]/g, "");
    let onlyDigits = digits.startsWith("+") ? `+${digits.slice(1).replace(/\D/g, "")}` : digits.replace(/\D/g, "");

    if (onlyDigits.startsWith("+7")) {
      const d = onlyDigits.slice(2).replace(/\D/g, "").slice(0, 10);
      return `+7${d}`;
    }

    const d = onlyDigits.replace(/\D/g, "");
    if (d.startsWith("8")) {
      const rest = d.slice(1).slice(0, 10);
      return `+7${rest}`;
    }
    if (d.startsWith("7")) {
      const rest = d.slice(1).slice(0, 10);
      return `+7${rest}`;
    }
    if (d.startsWith("9")) {
      return `+7${d.slice(0, 10)}`;
    }
    return raw.startsWith("+") ? `+${d.slice(0, 11)}` : d.slice(0, 11);
  };

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("pickup");
  const [paymentProvider, setPaymentProvider] = useState<"tbank" | "yookassa" | "sber_online" | "tinkoff_online">(
    "tbank"
  );
  const [contactName, setContactName] = useState(initial?.contactName || "");
  const [contactPhone, setContactPhone] = useState(initial?.contactPhone ? normalizePhone(initial.contactPhone) : "");
  const [contactEmail, setContactEmail] = useState((initial?.contactEmail || "").trim());
  const [deliveryCity, setDeliveryCity] = useState(
    initial?.deliveryCity ||
      (initial?.deliveryAddress ? initial.deliveryAddress.split(",")[0]?.trim() || "" : "")
  );
  const [deliveryAddress, setDeliveryAddress] = useState(initial?.deliveryAddress || "");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState(
    initial?.deliveryPhone ? normalizePhone(initial.deliveryPhone) : initial?.contactPhone ? normalizePhone(initial.contactPhone) : ""
  );
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deliveryPickupPoint, setDeliveryPickupPoint] = useState("");
  const [courierNote, setCourierNote] = useState("");
  const [runtimeItems, setRuntimeItems] = useState(items);
  const [guestLines, setGuestLines] = useState<{ productId: number; quantity: number }[]>([]);
  const [loadingItems, setLoadingItems] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) return;
    let cancelled = false;

    const load = async () => {
      const lines = guestCartRead();
      if (!cancelled) setGuestLines(lines);
      if (lines.length === 0) {
        if (!cancelled) {
          setRuntimeItems([]);
          setLoadingItems(false);
        }
        return;
      }
      try {
        const res = await fetch("/api/shop/products/bulk", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: lines.map((l) => l.productId) }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; products?: any[] } | null;
        const products = Array.isArray(data?.products) ? data?.products : [];
        const byId = new Map<number, any>(products.map((p) => [p.id, p]));
        const mapped = lines
          .map((l) => {
            const p = byId.get(l.productId);
            if (!p) return null;
            return { name: p.name as string, quantity: l.quantity, unitPriceKopeks: p.priceKopeks as number } as CheckoutItem;
          })
          .filter(Boolean) as CheckoutItem[];
        if (!cancelled) setRuntimeItems(mapped);
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const subtotal = useMemo(
    () => runtimeItems.reduce((sum, i) => sum + i.unitPriceKopeks * i.quantity, 0),
    [runtimeItems]
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
  const isTk = shippingMethod === "cdek" || shippingMethod === "yandex";
  const isValidPickupPoint = isTk ? deliveryPickupPoint.trim().length > 0 && deliveryPickupPoint.trim().length <= 200 : true;
  const isValidCourierNote = courierNote.length <= 200;
  const isValidDelivery =
    shippingMethod === "pickup" ? true : deliveryCity.trim().length > 0 && deliveryAddress.trim().length > 0 && isValidDeliveryPhone;

  const hasItems = runtimeItems.length > 0;
  const canSubmit =
    hasItems &&
    !loadingItems &&
    isValidName &&
    isValidPhone &&
    isValidEmail &&
    isValidComment &&
    isValidDelivery &&
    isValidPickupPoint &&
    isValidCourierNote;

  const submit = async () => {
    if (!canSubmit) {
      if (!isValidName) setFormError("Имя: только буквы (2–50 символов)");
      else if (!isValidPhone) setFormError("Телефон: формат +7XXXXXXXXXX");
      else if (!isValidEmail) setFormError("Email указан неверно");
      else if (!isValidDelivery) setFormError("Заполните город, адрес и телефон для доставки");
      else if (!isValidPickupPoint) setFormError("Укажите пункт выдачи / адрес для СДЭК или Яндекс");
      else if (!isValidCourierNote) setFormError("Комментарий курьеру не более 200 символов");
      else if (!isValidComment) setFormError("Комментарий не более 200 символов");
      return;
    }
    setIsLoading(true);
    setFormError(null);
    try {
      const deliveryAddressFinal =
        shippingMethod === "pickup"
          ? undefined
          : isTk
            ? `${deliveryAddress}${deliveryPickupPoint.trim() ? `, ${deliveryPickupPoint.trim()}` : ""}`
            : deliveryAddress;

      const commentFinal = [comment.trim(), courierNote.trim() ? `Комментарий курьеру: ${courierNote.trim()}` : ""].filter(Boolean).join("\n");

      const res = isAuthenticated
        ? await createShopOrder({
            shippingMethod,
            paymentProvider,
            contactName,
            contactPhone,
            contactEmail,
            deliveryPhone: shippingMethod === "pickup" ? undefined : deliveryPhone,
            deliveryCity: shippingMethod === "pickup" ? undefined : deliveryCity,
            deliveryAddress: deliveryAddressFinal,
            deliveryPostalCode: shippingMethod === "pickup" ? undefined : deliveryPostalCode,
            comment: commentFinal,
            csrfToken: getCsrfToken(),
          })
        : await createGuestShopOrder({
            items: guestLines,
            shippingMethod,
            paymentProvider,
            contactName,
            contactPhone,
            contactEmail,
            deliveryPhone: shippingMethod === "pickup" ? undefined : deliveryPhone,
            deliveryCity: shippingMethod === "pickup" ? undefined : deliveryCity,
            deliveryAddress: deliveryAddressFinal,
            deliveryPostalCode: shippingMethod === "pickup" ? undefined : deliveryPostalCode,
            comment: commentFinal,
            csrfToken: getCsrfToken(),
          });
      if (!res.ok) {
        setFormError(res.error || "Не удалось создать заказ");
        return;
      }

      if (!isAuthenticated) {
        guestCartClear();
        window.dispatchEvent(new CustomEvent("cart:changed"));
      }

      if (paymentProvider === "tbank") {
        const p = isAuthenticated
          ? await startTbankPayment(res.orderId, getCsrfToken())
          : await startTbankPaymentPublic(res.orderId, (res as any).publicAccessToken, getCsrfToken());
        if (!p.ok) {
          setFormError(p.error || "Не удалось создать оплату");
          return;
        }
        window.location.href = p.paymentUrl;
        return;
      }

      window.location.href = isAuthenticated ? `/shop/order/${res.orderId}` : `/shop/order/${res.orderId}?token=${encodeURIComponent((res as any).publicAccessToken)}`;
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
                onChange={(e) => setContactPhone(normalizePhone(e.target.value))}
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
                onChange={(e) => setContactEmail(e.target.value.trim())}
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
                <a
                  href="https://www.pochta.ru/shipment?type=PARCEL&weight=200"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Рассчитать самостоятельно
                </a>
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
                <a href="https://www.cdek-calc.ru/" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                  Рассчитать самостоятельно
                </a>
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
                <a href="https://dostavka.yandex.ru/order/" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                  Рассчитать самостоятельно
                </a>
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
                  maxLength={100}
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
                  onChange={(e) => setDeliveryPhone(normalizePhone(e.target.value))}
                  className={`w-full bg-slate-950 border ${isValidDeliveryPhone ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40`}
                  placeholder="+79000000000"
                  inputMode="tel"
                  pattern="^\+7\d{10}$"
                  maxLength={12}
                />
                {!isValidDeliveryPhone ? <div className="text-xs text-red-400 mt-1">Формат: +7XXXXXXXXXX</div> : null}
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
              {isTk ? (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Пункт выдачи / адрес</label>
                    <input
                      value={deliveryPickupPoint}
                      onChange={(e) => setDeliveryPickupPoint(e.target.value)}
                      className={`w-full bg-slate-950 border ${isValidPickupPoint ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40`}
                      placeholder="Например: СДЭК ПВЗ, код/адрес"
                      maxLength={200}
                    />
                    {!isValidPickupPoint ? <div className="text-xs text-red-400 mt-1">Укажите пункт выдачи/адрес</div> : null}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Комментарий курьеру (опц.)</label>
                    <input
                      value={courierNote}
                      onChange={(e) => setCourierNote(e.target.value)}
                      className={`w-full bg-slate-950 border ${isValidCourierNote ? "border-slate-800" : "border-red-500/60"} rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/40`}
                      maxLength={200}
                      placeholder="Например: звонок за 30 минут, подъезд, этаж"
                    />
                    {!isValidCourierNote ? <div className="text-xs text-red-400 mt-1">Не более 200 символов</div> : null}
                  </div>
                </>
              ) : null}
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
            {loadingItems ? (
              <div className="text-sm text-gray-500">
                <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
                Загрузка…
              </div>
            ) : null}
            {!loadingItems && runtimeItems.length === 0 ? (
              <div className="text-sm text-gray-500">Корзина пуста</div>
            ) : null}
            {runtimeItems.map((i, idx) => (
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
                {shippingMethod === "cdek" || shippingMethod === "yandex" ? "по тарифу (уточним)" : formatRub(shippingCost)}
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

          {formError ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">{formError}</div>
          ) : null}

          <div className="text-xs text-gray-500">
            При выборе ТБанк будет редирект на защищённую страницу оплаты (не iframe).
          </div>
        </div>
      </div>
    </div>
  );
}
