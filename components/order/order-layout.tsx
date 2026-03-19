import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function OrderLayout({
  title,
  subtitle,
  backUrl,
  backLabel = "Назад",
  statusBadge,
  paymentBadge,
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
  headerAction?: React.ReactNode;
  mainContent: React.ReactNode;
  sidebarContent?: React.ReactNode;
}) {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          {backUrl && (
            <Link
              href={backUrl}
              className="inline-flex items-center text-sm text-gray-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {backLabel}
            </Link>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
              {title}
              {statusBadge && <div className="mt-1 md:mt-0">{statusBadge}</div>}
              {paymentBadge && <div className="mt-1 md:mt-0">{paymentBadge}</div>}
            </h1>
            {subtitle && <div className="text-sm text-gray-400 mt-1">{subtitle}</div>}
          </div>
        </div>
        {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Main Content */}
        <div className={cn("space-y-6 lg:col-span-8", !sidebarContent && "lg:col-span-12")}>
          {mainContent}
        </div>

        {/* Sidebar */}
        {sidebarContent && (
          <div className="lg:col-span-4 space-y-6 sticky top-24">
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
