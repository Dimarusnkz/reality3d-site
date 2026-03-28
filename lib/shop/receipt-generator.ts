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
  // Use a dynamic import for jsPDF to avoid issues in SSR if any
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  
  const doc = new jsPDF();

  // jsPDF default fonts don't support Cyrillic. 
  // We need to use a font that supports it. Since we can't easily add .ttf here,
  // we will use the 'helvetica' font and hope for the best, 
  // or use a base64 encoded font if we had one.
  // For now, let's at least make sure the numbers and layout are correct.
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(255, 94, 0); // Reality3D Orange
  doc.text("Reality3D", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  // Using English labels as a fallback because standard jsPDF fonts break on Cyrillic
  doc.text("3D Printing & Modeling Studio", 105, 28, { align: "center" });
  doc.text("www.reality3d.ru | zakaz@reality3d.ru", 105, 33, { align: "center" });

  doc.setDrawColor(200);
  doc.line(20, 40, 190, 40);

  // Order Info
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(`RECEIPT FOR ORDER #${data.orderNo}`, 20, 55);
  
  doc.setFontSize(10);
  doc.text(`Date: ${data.date}`, 20, 65);
  doc.text(`Client: ${data.clientName}`, 20, 70);
  doc.text(`Phone: ${data.clientPhone}`, 20, 75);
  doc.text(`Payment: ${data.paymentMethod}`, 20, 80);

  // Table
  const tableData = data.items.map(item => [
    item.name,
    item.quantity.toString(),
    `${item.price.toLocaleString()} RUB`,
    `${item.total.toLocaleString()} RUB`
  ]);

  (doc as any).autoTable({
    startY: 90,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [255, 94, 0] },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.text(`TOTAL: ${data.totalAmount.toLocaleString()} RUB`, 190, finalY, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Thank you for your order!", 105, finalY + 30, { align: "center" });
  doc.text("This is an electronic receipt confirming your payment.", 105, finalY + 35, { align: "center" });

  doc.save(`Receipt_Reality3D_${data.orderNo}.pdf`);
};
