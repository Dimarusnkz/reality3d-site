"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "auto" | "light" | "dark";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileProps = {
  onToken: (token: string) => void;
  className?: string;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Turnstile({ onToken, className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) return;

    const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile-script='true']");
    if (existing) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!SITE_KEY) {
      onToken("");
      return;
    }

    if (!ready) return;
    if (!containerRef.current) return;
    if (!window.turnstile?.render) return;

    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
      }
      widgetIdRef.current = null;
    }

    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "dark",
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });

    widgetIdRef.current = widgetId;

    return () => {
      if (widgetIdRef.current) {
        try {
          window.turnstile?.remove(widgetIdRef.current);
        } catch {
        }
        widgetIdRef.current = null;
      }
    };
  }, [onToken, ready]);

  if (!SITE_KEY) {
    return (
      <div className={cn("p-3 rounded-xl border border-slate-800 bg-slate-900/50 text-xs text-gray-400", className)}>
        Captcha не настроена
      </div>
    );
  }

  return <div ref={containerRef} className={cn("min-h-[66px]", className)} />;
}

