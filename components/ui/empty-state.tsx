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
    <div className={cn("flex flex-col items-center justify-center text-center py-14 px-6", className)}>
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <div className="text-lg font-semibold text-white">{title}</div>
      {description ? <div className="text-sm text-gray-400 mt-2 max-w-[520px]">{description}</div> : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-2 justify-center">{actions}</div> : null}
    </div>
  );
}

