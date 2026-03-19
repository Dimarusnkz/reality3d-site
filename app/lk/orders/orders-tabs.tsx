"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import OrdersList from "./orders-list";
import ShopOrdersList from "./shop-orders-list";
import { Calculator, ShoppingCart } from "lucide-react";

export default function OrdersTabs({ calcOrders, shopOrders }: { calcOrders: any[]; shopOrders: any[] }) {
  const [activeTab, setActiveTab] = useState<"calc" | "shop">("calc");

  const tabs = [
    { id: "calc", label: "3D‑печать", icon: Calculator, count: calcOrders.length },
    { id: "shop", label: "Магазин", icon: ShoppingCart, count: shopOrders.length },
  ];

  return (
    <div className="space-y-8">
      <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-slate-800 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "text-gray-500")} />
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-md text-[10px]",
                activeTab === tab.id ? "bg-primary/20 text-primary" : "bg-slate-800 text-gray-500"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === "calc" ? (
          <OrdersList initialOrders={calcOrders} />
        ) : (
          <ShopOrdersList orders={shopOrders} />
        )}
      </div>
    </div>
  );
}
