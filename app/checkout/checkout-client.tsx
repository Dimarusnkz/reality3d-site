"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Truck, 
  CreditCard, 
  Check, 
  ArrowRight, 
  Info, 
  Loader2, 
  ShoppingCart,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRub } from "@/lib/shop/money";
import { createShopOrder } from "@/app/actions/shop";
import { guestCartClear } from "@/lib/shop/guest-cart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PICKUP_ADDRESS = "Санкт-Петербург, пр. Современников, д. 1, к. 3";
const PICKUP_PHONE = "+7 (999) 000-00-00";

type CheckoutClientProps = {
  cart: any;
  user: any;
  isAuthenticated: boolean;
};

export default function CheckoutClient({ cart, user, isAuthenticated }: CheckoutClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");

  const [shippingMethod, setShippingMethod] = useState<"pickup" | "cdek" | "courier_spb" | "russian_post" | "yandex">("pickup");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPickupPoint, setDeliveryPickupPoint] = useState("");

  const normalizePhone = (val: string) => {
    let s = val.replace(/[^\d+]/g, "");
    if (s.startsWith("8")) s = "+7" + s.slice(1);
    if (s.length > 0 && !s.startsWith("+")) s = "+" + s;
    return s.slice(0, 12);
  };

  const isValidName = contactName.trim().length >= 2;
  const isValidPhone = /^\+7\d{10}$/.test(contactPhone);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
  const isValidDelivery = shippingMethod === "pickup" || (deliveryCity.trim().length > 0 && (deliveryAddress.trim().length > 0 || deliveryPickupPoint.trim().length > 0));

  const currentStep = !isValidName || !isValidPhone || !isValidEmail ? 1 : !isValidDelivery ? 2 : 3;

  const handleCreateOrder = async () => {
    if (currentStep < 3) return;
    setIsLoading(true);

    try {
      const res = await createShopOrder({
        contactName,
        contactPhone,
        contactEmail,
        shippingMethod,
        deliveryCity,
        deliveryAddress: shippingMethod === "pickup" ? PICKUP_ADDRESS : (deliveryAddress || deliveryPickupPoint),
      });

      if (res.error) {
        alert(res.error);
        return;
      }

      if (!isAuthenticated) {
        guestCartClear();
        window.dispatchEvent(new CustomEvent("cart:changed"));
      }

      const tokenPart = isAuthenticated ? "" : `?token=${encodeURIComponent((res as any).publicAccessToken)}`;
      window.location.href = `/shop/order/${res.orderId}${tokenPart}${tokenPart ? "&" : "?"}pay=1&justCreated=1`;
    } catch (e) {
      console.error(e);
      alert("Произошла ошибка при создании заказа");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: "Контакты", icon: User },
    { title: "Доставка", icon: Truck },
    { title: "Оплата", icon: CreditCard },
  ];

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-16 w-16 text-slate-800 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Ваша корзина пуста</h1>
        <p className="text-gray-500 mb-8 text-lg">Добавьте товары в корзину, чтобы продолжить</p>
        <Button onClick={() => router.push("/shop")} size="lg">Перейти в магазин</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <Badge variant="secondary" className="mb-2">Reality3D Checkout</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Оформление заказа</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
        <div className="space-y-12">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
            {steps.map((s, idx) => {
              const num = idx + 1;
              const isCompleted = currentStep > num;
              const isActive = currentStep === num;
              return (
                <div key={s.title} className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-xl",
                    isCompleted ? "bg-green-500 border-green-500 text-white" :
                    isActive ? "bg-primary border-primary text-white scale-110 shadow-primary/20" :
                    "bg-slate-950 border-slate-800 text-gray-500"
                  )}>
                    {isCompleted ? <Check className="h-7 w-7" /> : <s.icon className="h-6 w-6" />}
                  </div>
                  <div className={cn(
                    "absolute top-18 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] transition-colors mt-4",
                    isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-gray-500"
                  )}>
                    {s.title}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-10 space-y-12">
            {/* Step 1: Contacts */}
            <div className={cn("space-y-6 transition-all duration-500", currentStep !== 1 && "opacity-40 grayscale pointer-events-none scale-[0.98]")}>
              <h2 className="text-2xl font-bold text-white flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-gray-400 font-bold">1</div>
                Контактные данные
              </h2>
              <div className="grid sm:grid-cols-2 gap-6 p-8 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-sm shadow-inner">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Ваше имя</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Телефон</label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(normalizePhone(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700"
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email для уведомлений</label>
                  <input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value.trim())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700"
                    placeholder="example@mail.ru"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery */}
            <div className={cn("space-y-6 transition-all duration-500", currentStep !== 2 && "opacity-40 grayscale pointer-events-none scale-[0.98]")}>
              <h2 className="text-2xl font-bold text-white flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-gray-400 font-bold">2</div>
                Способ получения
              </h2>
              <div className="space-y-8 p-8 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-sm shadow-inner">
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShippingMethod("pickup")}
                    className={cn(
                      "p-6 rounded-2xl border text-left transition-all relative group overflow-hidden",
                      shippingMethod === "pickup" ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    )}
                  >
                    <div className="font-bold text-white mb-1 group-hover:text-primary transition-colors">Самовывоз</div>
                    <div className="text-xs text-gray-500">Бесплатно, Санкт-Петербург</div>
                    {shippingMethod === "pickup" && <Check className="absolute top-4 right-4 h-5 w-5 text-primary" />}
                  </button>
                  <button
                    onClick={() => setShippingMethod("cdek")}
                    className={cn(
                      "p-6 rounded-2xl border text-left transition-all relative group overflow-hidden",
                      shippingMethod === "cdek" ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    )}
                  >
                    <div className="font-bold text-white mb-1 group-hover:text-primary transition-colors">СДЭК</div>
                    <div className="text-xs text-gray-500">До пункта выдачи или двери</div>
                    {shippingMethod === "cdek" && <Check className="absolute top-4 right-4 h-5 w-5 text-primary" />}
                  </button>
                </div>

                {shippingMethod === "pickup" ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-5">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-sm text-gray-400 leading-relaxed">
                      <div className="text-white font-bold mb-1">Reality3D Студия:</div>
                      {PICKUP_ADDRESS} <br/>
                      <span className="text-xs mt-2 block">Звонить при прибытии: {PICKUP_PHONE}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Город</label>
                      <input
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700"
                        placeholder="Москва"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Адрес или ПВЗ СДЭК</label>
                      <textarea
                        value={deliveryPickupPoint}
                        onChange={(e) => setDeliveryPickupPoint(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-gray-700"
                        placeholder="Укажите точный адрес или номер пункта выдачи"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Payment */}
            <div className={cn("space-y-6 transition-all duration-500", currentStep !== 3 && "opacity-40 grayscale pointer-events-none scale-[0.98]")}>
              <h2 className="text-2xl font-bold text-white flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-gray-400 font-bold">3</div>
                Оплата
              </h2>
              <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-sm shadow-inner space-y-6">
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 border-dashed">
                  <div className="font-bold text-white mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Как оплатить:
                  </div>
                  <ul className="text-xs text-gray-500 space-y-3 list-none">
                    <li className="flex gap-3"><span className="text-primary font-bold">01.</span> Нажмите кнопку "Оформить" ниже</li>
                    <li className="flex gap-3"><span className="text-primary font-bold">02.</span> Откроется страница оплаты (карта или QR)</li>
                    <li className="flex gap-3"><span className="text-primary font-bold">03.</span> После оплаты статус заказа обновится в ЛК</li>
                  </ul>
                </div>
                
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Банковская карта / СБП</div>
                    <div className="text-xs text-gray-500">Безопасная оплата через шлюз Т-Банка</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="neon-card p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-slate-800/50 pb-4">Ваш заказ</h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.items.map((it: any) => (
                <div key={it.productId} className="flex justify-between gap-4 text-sm">
                  <div className="text-gray-400 line-clamp-2 flex-1">{it.product.name}</div>
                  <div className="text-white font-bold whitespace-nowrap">
                    {it.quantity} × {formatRub(it.product.priceKopeks)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-800/50 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Товары ({cart.items.length})</span>
                <span className="text-white font-bold">{formatRub(cart.totalKopeks)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Доставка</span>
                <span className="text-white font-bold">{shippingMethod === "pickup" ? "Бесплатно" : "Расчет в ТК"}</span>
              </div>
              <div className="flex justify-between items-end pt-4">
                <span className="text-lg font-bold text-white">Итого</span>
                <span className="text-3xl font-black text-primary tracking-tighter shadow-primary/20">{formatRub(cart.totalKopeks)}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleCreateOrder}
                disabled={isLoading || currentStep < 3}
                className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Оформить заказ
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-[10px] text-gray-600 text-center leading-relaxed px-4">
              Нажимая кнопку, вы подтверждаете согласие с правилами работы сервиса Reality3D.
            </p>
          </div>
          
          <div className="mt-6 p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50 flex items-start gap-4">
             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
               <Package className="h-5 w-5 text-gray-500" />
             </div>
             <div className="text-[11px] text-gray-500 leading-relaxed">
               После оформления заказа вы сможете отслеживать его статус в личном кабинете. Срок сборки обычно составляет 1-2 рабочих дня.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
