"use client";

import { useEffect, useState } from "react";
import { addToCart } from "@/app/actions/shop";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { guestCartAdd } from "@/lib/shop/guest-cart";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function AddToCartButton({ productId, disabled }: { productId: number; disabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1400);
    return () => clearTimeout(t);
  }, [justAdded]);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const res = await addToCart(productId, 1, getCsrfToken());
      if (!res.ok) {
        if ((res.error || "").toLowerCase().includes("нужно войти")) {
          guestCartAdd(productId, 1);
        } else {
          alert(res.error || "Не удалось добавить в корзину");
          return;
        }
      }
      setJustAdded(true);
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : justAdded ? (
        <Check className="w-4 h-4 mr-2" />
      ) : (
        <ShoppingCart className="w-4 h-4 mr-2" />
      )}
      {justAdded ? "Добавлено" : "В корзину"}
    </button>
  );
}
