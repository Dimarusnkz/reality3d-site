"use client";

import { FileDown } from "lucide-react";
import { generateReceiptPDF } from "@/lib/shop/receipt-generator";

interface DownloadShopReceiptButtonProps {
  order: any;
}

export function DownloadShopReceiptButton({ order }: DownloadShopReceiptButtonProps) {
  const handleDownload = () => {
    generateReceiptPDF({
      orderNo: String(order.orderNo),
      date: new Date(order.createdAt).toLocaleDateString('ru-RU'),
      clientName: order.contactName || "Клиент",
      clientPhone: order.contactPhone || "—",
      items: order.items.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        price: item.priceKopeks / 100,
        total: (item.priceKopeks * item.quantity) / 100
      })),
      totalAmount: order.totalKopeks / 100,
      paymentMethod: order.paymentProvider === 'cash' ? 'Наличные' : 'Карта (онлайн)'
    });
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-primary/5"
    >
      <FileDown className="h-4 w-4" />
      Скачать чек в PDF
    </button>
  );
}
