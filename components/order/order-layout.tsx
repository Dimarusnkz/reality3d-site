import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

export type StatusStep = {
  title: string;
  isCompleted: boolean;
  isActive: boolean;
};

export function StatusStepper({ steps }: { steps: StatusStep[] }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Line background */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
        
        {steps.map((step, idx) => (
          <div key={step.title} className="relative z-10 flex flex-col items-center group">
            <div className={cn(
              "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg",
              step.isCompleted ? "bg-green-500 border-green-500 text-white" : 
              step.isActive ? "bg-primary border-primary text-white scale-110 shadow-primary/20" : 
              "bg-slate-900 border-slate-800 text-gray-500"
            )}>
              {step.isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-bold">{idx + 1}</span>
              )}
            </div>
            <div className={cn(
              "absolute top-12 whitespace-nowrap text-xs font-bold transition-colors uppercase tracking-widest",
              step.isActive ? "text-primary" : step.isCompleted ? "text-green-500" : "text-gray-500"
            )}>
              {step.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderLayout({
  title,
  subtitle,
  backUrl,
  backLabel = "Назад",
  statusBadge,
  paymentBadge,
  statusSteps,
  headerAction,
  mainContent,
  sidebarContent,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backUrl?: string;
  backLabel?: string;
  statusBadge?: React.ReactNode;
  paymentBadge?: React.ReactNode;
  statusSteps?: StatusStep[];
  headerAction?: React.ReactNode;
  mainContent: React.ReactNode;
  sidebarContent?: React.ReactNode;
}) {
  return (
    <div className="space-y-6 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4 w-full">
          {backUrl && (
            <Link
              href={backUrl}
              className="inline-flex items-center text-sm text-gray-500 hover:text-primary transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              {backLabel}
            </Link>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-4 flex-wrap tracking-tight">
                {title}
                <div className="flex gap-2">
                  {statusBadge}
                  {paymentBadge}
                </div>
              </h1>
              {subtitle && <div className="text-sm text-gray-500 mt-2 font-medium">{subtitle}</div>}
            </div>
            {headerAction && <div className="shrink-0">{headerAction}</div>}
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      {statusSteps && (
        <div className="neon-card p-6 md:p-8 rounded-2xl border border-slate-800/50 bg-slate-900/10">
          <StatusStepper steps={statusSteps} />
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content */}
        <div className={cn("space-y-8 lg:col-span-8", !sidebarContent && "lg:col-span-12")}>
          {mainContent}
        </div>

        {/* Sidebar */}
        {sidebarContent && (
          <div className="lg:col-span-4 space-y-8 sticky top-24">
            {sidebarContent}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderSection({
  title,
  children,
  className,
  headerAction,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className={cn("bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden", className)}>
      {title && (
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="font-semibold text-white">{title}</div>
          {headerAction}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

export function OrderInfoRow({
  label,
  value,
  subvalue,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  subvalue?: React.ReactNode;
}) {
  return (
    <div className="py-3 first:pt-0 last:pb-0 border-b border-slate-800/50 last:border-0">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-white">{value}</div>
      {subvalue && <div className="text-sm text-gray-500 mt-0.5">{subvalue}</div>}
    </div>
  );
}
