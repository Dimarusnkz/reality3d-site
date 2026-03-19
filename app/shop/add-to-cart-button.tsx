"use client";

import { useEffect, useState } from "react";
import { addToCart } from "@/app/actions/shop";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { guestCartAdd } from "@/lib/shop/guest-cart";

import { cn } from "@/lib/utils";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function AddToCartButton({ 
  productId, 
  disabled,
  className 
}: { 
  productId: number; 
  disabled?: boolean;
  className?: string;
}) {
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
      className={cn(
        "h-10 px-4 rounded-lg bg-primary hover:bg-orange-600 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 w-full",
        justAdded && "bg-green-500 hover:bg-green-500",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : justAdded ? (
        <>
          <Check className="h-4 w-4" /> Добавлено
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" /> Купить
        </>
      )}
    </button>
  );
}
