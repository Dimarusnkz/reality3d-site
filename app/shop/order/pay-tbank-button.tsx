"use client";

import { useState } from "react";
import { startTbankPayment, startTbankPaymentPublic } from "@/app/actions/shop";
import { Loader2 } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function PayTbankButton({ orderId, publicAccessToken }: { orderId: string; publicAccessToken?: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = publicAccessToken
        ? await startTbankPaymentPublic(orderId, publicAccessToken, getCsrfToken())
        : await startTbankPayment(orderId, getCsrfToken());
      if (!res.ok) {
        setError(res.error || "Ошибка");
        return;
      }
      window.location.href = res.paymentUrl;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={pay}
        disabled={isLoading}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Оплатить (ТБанк)
      </button>
      {error ? <div className="text-xs text-red-400">{error}</div> : null}
    </div>
  );
}
