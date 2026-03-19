import * as React from "react";
import { cn } from "@/lib/utils";

export function Steps({
  steps,
  current,
  className,
}: {
  steps: { title: string; description?: string }[];
  current: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-3", className)}>
      {steps.map((s, idx) => {
        const stepNo = idx + 1;
        const isActive = stepNo === current;
        const isDone = stepNo < current;
        return (
          <div
            key={s.title}
            className={cn(
              "rounded-xl border px-4 py-3 bg-slate-900/40",
              isActive ? "border-primary/60 shadow-[0_0_15px_rgba(255,94,0,0.15)]" : "border-slate-800",
              isDone ? "opacity-80" : "opacity-100"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                  isDone ? "bg-green-500/15 text-green-400 border border-green-500/20" : isActive ? "bg-primary/15 text-primary border border-primary/20" : "bg-slate-800 text-gray-300 border border-slate-700"
                )}
              >
                {stepNo}
              </div>
              <div className="min-w-0">
                <div className={cn("text-sm font-semibold truncate", isActive ? "text-white" : "text-gray-200")}>{s.title}</div>
                {s.description ? <div className="text-xs text-gray-500 truncate">{s.description}</div> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

