"use client";

import { useState } from "react";
import { addToCart } from "@/app/actions/shop";
import { ShoppingCart, Loader2 } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function AddToCartButton({ productId, disabled }: { productId: number; disabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const res = await addToCart(productId, 1, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Не удалось добавить в корзину");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
      В корзину
    </button>
  );
}

