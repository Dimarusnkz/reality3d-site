import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 hover:-translate-y-0.5",
  secondary: "bg-slate-800 text-white hover:bg-slate-700",
  outline: "border border-slate-800 bg-slate-950 text-white hover:bg-slate-900/50",
  ghost: "text-white hover:bg-slate-900/50",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "className"> & { className?: string; variant?: Variant; size?: Size }) {
  return <Link href={href} className={cn(base, variantClass[variant], sizeClass[size], className)} {...props} />;
}
