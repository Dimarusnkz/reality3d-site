"use client";

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatRub } from "@/lib/shop/money";

interface ReceiptData {
  orderNo: string;
  date: string;
  clientName: string;
  clientPhone: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
}

export const generateReceiptPDF = async (data: ReceiptData) => {
  const doc = new jsPDF();

  // Load font that supports Cyrillic
  // Since we can't easily bundle a .ttf in this environment without a URL, 
  // we will use a workaround or standard fonts if they support it.
  // Standard jsPDF fonts don't support Cyrillic well.
  // For a production app, we would use doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(255, 94, 0); // Reality3D Orange
  doc.text("Reality3D", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Студия 3D-печати и моделирования", 105, 28, { align: "center" });
  doc.text("www.reality3d.ru | zakaz@reality3d.ru", 105, 33, { align: "center" });

  doc.setDrawColor(200);
  doc.line(20, 40, 190, 40);

  // Order Info
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`ЧЕК ПО ЗАКАЗУ #${data.orderNo}`, 20, 55);
  
  doc.setFontSize(10);
  doc.text(`Дата: ${data.date}`, 20, 65);
  doc.text(`Клиент: ${data.clientName}`, 20, 70);
  doc.text(`Телефон: ${data.clientPhone}`, 20, 75);
  doc.text(`Способ оплаты: ${data.paymentMethod}`, 20, 80);

  // Table
  const tableData = data.items.map(item => [
    item.name,
    item.quantity.toString(),
    `${item.price.toLocaleString()} p.`,
    `${item.total.toLocaleString()} p.`
  ]);

  (doc as any).autoTable({
    startY: 90,
    head: [['Наименование', 'Кол-во', 'Цена', 'Сумма']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [255, 94, 0] },
    styles: { font: 'helvetica', fontSize: 9 }, // Note: helvetica won't show Cyrillic properly without custom font
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.text(`ИТОГО: ${data.totalAmount.toLocaleString()} p.`, 190, finalY, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Спасибо за ваш заказ!", 105, finalY + 30, { align: "center" });
  doc.text("Это электронный чек, подтверждающий факт оплаты.", 105, finalY + 35, { align: "center" });

  doc.save(`Receipt_Reality3D_${data.orderNo}.pdf`);
};
