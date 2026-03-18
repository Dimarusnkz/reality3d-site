"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clearCart, setCartItemQuantity } from "@/app/actions/shop";
import { formatRub } from "@/lib/shop/money";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { guestCartClear, guestCartRead, guestCartSet } from "@/lib/shop/guest-cart";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type CartItem = {
  productId: number;
  name: string;
  slug: string;
  unitPriceKopeks: number;
  quantity: number;
  stock: number;
  imageUrl: string | null;
};

export function CartClient({ initialItems, mode }: { initialItems: CartItem[]; mode: "auth" | "guest" }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const [loadingGuest, setLoadingGuest] = useState(mode === "guest");

  useEffect(() => {
    if (mode !== "guest") return;
    let cancelled = false;

    const load = async () => {
      const lines = guestCartRead();
      if (lines.length === 0) {
        if (!cancelled) {
          setItems([]);
          setLoadingGuest(false);
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
        const mapped: CartItem[] = lines
          .map((l) => {
            const p = byId.get(l.productId);
            if (!p) return null;
            return {
              productId: p.id,
              name: p.name,
              slug: p.slug,
              unitPriceKopeks: p.priceKopeks,
              quantity: l.quantity,
              stock: p.stock,
              imageUrl: p.imageUrl,
            } as CartItem;
          })
          .filter(Boolean) as CartItem[];

        if (!cancelled) setItems(mapped);
      } finally {
        if (!cancelled) setLoadingGuest(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceKopeks * i.quantity, 0),
    [items]
  );

  const updateQty = async (productId: number, nextQty: number) => {
    setBusy(productId);
    try {
      if (mode === "auth") {
        const res = await setCartItemQuantity(productId, nextQty, getCsrfToken());
        if (!res.ok) {
          alert(res.error || "Ошибка");
          return;
        }
      } else {
        guestCartSet(productId, nextQty);
      }
      setItems((prev) =>
        prev
          .map((i) => (i.productId === productId ? { ...i, quantity: nextQty } : i))
          .filter((i) => i.quantity > 0)
      );
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } finally {
      setBusy(null);
    }
  };

  const handleClear = async () => {
    if (!confirm("Очистить корзину?")) return;
    setBusy("all");
    try {
      if (mode === "auth") {
        const res = await clearCart(getCsrfToken());
        if (!res.ok) {
          alert(res.error || "Ошибка");
          return;
        }
      } else {
        guestCartClear();
      }
      setItems([]);
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } finally {
      setBusy(null);
    }
  };

  if (mode === "guest" && loadingGuest) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 text-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
        Загрузка корзины…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 text-center text-gray-400">
        Корзина пуста. <Link href="/shop" className="text-primary hover:underline">Перейти в магазин</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 font-medium">Товар</th>
              <th className="p-4 font-medium text-center">Количество</th>
              <th className="p-4 font-medium text-right">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((i) => (
              <tr key={i.productId} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={i.imageUrl || "/grid.svg"}
                        alt={i.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/shop/${i.slug}`} className="text-white font-medium hover:text-primary transition-colors">
                        {i.name}
                      </Link>
                      <div className="text-xs text-gray-500 mt-0.5">{formatRub(i.unitPriceKopeks)} / шт</div>
                      {i.stock > 0 ? (
                        <div className="text-xs text-green-500 mt-0.5">В наличии: {i.stock}</div>
                      ) : (
                        <div className="text-xs text-yellow-500 mt-0.5">Под заказ</div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateQty(i.productId, Math.max(0, i.quantity - 1))}
                      disabled={busy === i.productId}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-50"
                      title="Уменьшить"
                    >
                      {busy === i.productId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                    </button>
                    <div className="w-10 text-center text-white font-semibold">{i.quantity}</div>
                    <button
                      onClick={() => updateQty(i.productId, i.quantity + 1)}
                      disabled={busy === i.productId}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-50"
                      title="Увеличить"
                    >
                      {busy === i.productId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => updateQty(i.productId, 0)}
                      disabled={busy === i.productId}
                      className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center disabled:opacity-50 ml-2"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>

                <td className="p-4 text-right text-white font-semibold">{formatRub(i.unitPriceKopeks * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={handleClear}
          disabled={busy === "all"}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium disabled:opacity-50"
        >
          {busy === "all" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Очистить корзину
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-gray-300">
            Итого: <span className="text-white font-bold">{formatRub(total)}</span>
          </div>
          <Link
            href="/checkout"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all"
          >
            Оформить
          </Link>
        </div>
      </div>
    </div>
  );
}
