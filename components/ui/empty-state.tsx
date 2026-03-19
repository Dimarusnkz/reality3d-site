"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      <div className="w-20 h-20 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center mb-6 shadow-inner">
        <Icon className="w-10 h-10 text-gray-400/80" />
      </div>
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      {description ? (
        <p className="text-gray-400 mt-3 max-w-[440px] leading-relaxed">
          {description}
        </p>
      ) : null}
      {actions ? <div className="mt-8 flex flex-wrap gap-3 justify-center">{actions}</div> : null}
    </div>
  );
}

