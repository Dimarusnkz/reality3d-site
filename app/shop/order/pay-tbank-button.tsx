"use client";

import { useState } from "react";
import { startTbankPayment } from "@/app/actions/shop";
import { Loader2 } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export function PayTbankButton({ orderId }: { orderId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const pay = async () => {
    setIsLoading(true);
    try {
      const res = await startTbankPayment(orderId, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      window.location.href = res.paymentUrl;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={pay}
      disabled={isLoading}
      className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      Оплатить (ТБанк)
    </button>
  );
}

