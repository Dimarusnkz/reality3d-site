import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "secondary" | "success" | "warning" | "error" | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary/15 text-primary border-primary/20",
  secondary: "bg-slate-800 text-gray-300 border-slate-700",
  outline: "bg-transparent text-gray-400 border-slate-800",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function Badge({ 
  className, 
  variant = "default",
  ...props 
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium border transition-colors", 
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

