"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function OrderPaymentWatcher({
  orderId,
  token,
  initialPaid,
  redirectTo,
  enabled,
}: {
  orderId: string;
  token?: string | null;
  initialPaid: boolean;
  redirectTo: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const wasPaidRef = useRef<boolean>(initialPaid);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const tick = async () => {
      const qs = new URLSearchParams({ id: orderId });
      if (token) qs.set("token", token);

      const res = await fetch(`/api/shop/order-status?${qs.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { paid?: boolean };
      if (cancelled) return;

      const paid = Boolean(data.paid);
      if (!wasPaidRef.current && paid) {
        wasPaidRef.current = true;
        router.replace(redirectTo);
        router.refresh();
      }
    };

    const id = window.setInterval(() => {
      tick().catch(() => {});
    }, 3000);

    tick().catch(() => {});

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, orderId, token, redirectTo, router]);

  return null;
}

