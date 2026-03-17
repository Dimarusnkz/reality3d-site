"use client";

import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, Monitor, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

function applyTheme(mode: ThemeMode) {
  const doc = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  doc.classList.toggle("dark", isDark);
  doc.dataset.theme = mode;
}

export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const initial: ThemeMode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    setMode(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => {
      const current = (document.documentElement.dataset.theme as ThemeMode | undefined) || mode;
      if (current === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const items = useMemo(
    () =>
      [
        { key: "light" as const, label: "Light", icon: Sun },
        { key: "dark" as const, label: "Dark", icon: Moon },
        { key: "system" as const, label: "System", icon: Monitor },
      ],
    []
  );

  const current = items.find((x) => x.key === mode) || items[2];
  const CurrentIcon = current.icon;

  const setTheme = (next: ThemeMode) => {
    localStorage.setItem("theme", next);
    setMode(next);
    applyTheme(next);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="hidden lg:inline">{current.label}</span>
        <ChevronDown className="h-4 w-4 opacity-70" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.key === mode;
            return (
              <button
                key={item.key}
                role="menuitem"
                type="button"
                onClick={() => setTheme(item.key)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900",
                  active && "bg-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

