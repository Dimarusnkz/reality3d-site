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
      <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-gray-500 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <tab.icon className={cn("h-3.5 w-3.5", activeTab === tab.id ? "text-white" : "text-gray-600")} />
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-lg text-[9px] font-black",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-800 text-gray-600"
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
