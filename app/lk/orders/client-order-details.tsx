"use client";

import { useState, useEffect, useRef } from "react";
import { X, MessageSquare, Loader2, RefreshCw, FileDown } from "lucide-react";
import { getOrderDetails, addOrderComment, createOrder } from "@/app/actions/orders";
import { cn } from "@/lib/utils";
import { getCalcOrderStatusMeta } from "@/lib/orders/calc-order-status";
import { generateReceiptPDF } from "@/lib/shop/receipt-generator";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

interface ClientOrderDetailsModalProps {
  orderId: number | null;
  onClose: () => void;
}

export function ClientOrderDetailsModal({ orderId, onClose }: ClientOrderDetailsModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const wasPaidRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (orderId) {
      setIsLoading(true);
      getOrderDetails(orderId).then((data) => {
        setOrder(data);
        setIsLoading(false);
      });
    } else {
      setOrder(null);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    if (wasPaidRef.current == null && order?.status) {
      wasPaidRef.current = order.status === "paid";
    }
  }, [orderId, order?.status]);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    const tick = async () => {
      const updated = await getOrderDetails(orderId);
      if (cancelled) return;

      setOrder(updated);
      const paid = updated?.status === "paid";
      if (wasPaidRef.current === false && paid) {
        onClose();
        window.location.href = "/lk";
      }
    };

    const id = window.setInterval(() => {
      tick().catch(() => {});
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, onClose]);

  if (!orderId) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    const res = await addOrderComment(orderId, commentText, getCsrfToken());
    if (res.success) {
      const updated = await getOrderDetails(orderId);
      setOrder(updated);
      setCommentText("");
    }
    setIsSubmitting(false);
  };

  const handleRepeatOrder = async () => {
      if (!order) return;
      if (!confirm("Создать копию этого заказа?")) return;

      setIsRepeating(true);
      const details = JSON.parse(order.details || "{}");
      const res = await createOrder({
          title: order.title + " (Копия)",
          details: details,
          csrfToken: getCsrfToken(),
      });
      setIsRepeating(false);

      if (res.success) {
          alert("Заказ успешно скопирован!");
          onClose();
          window.location.reload();
      } else {
          alert("Ошибка при копировании заказа");
      }
  };

  const handleDownloadReceipt = () => {
    if (!order || order.status !== 'paid') return;
    
    generateReceiptPDF({
      orderNo: String(order.id),
      date: new Date(order.createdAt).toLocaleDateString('ru-RU'),
      clientName: order.user.name || "Клиент",
      clientPhone: order.user.phone || "—",
      items: [{
        name: order.title || "3D Печать",
        quantity: 1,
        price: order.price,
        total: order.price
      }],
      totalAmount: order.price,
      paymentMethod: "Карта (онлайн)"
    });
  };
  
  // Helper to parse details safely
  const getFiles = () => {
    try {
      const details = JSON.parse(order.details || "{}");
      return details.files || [];
    } catch {
      return [];
    }
  };
  
  const files = order ? getFiles() : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {isLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : order ? (
            <>
                <div className="p-6 border-b border-slate-800">
                    <div className="flex justify-between items-start pr-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Заказ #{order.id}</h2>
                            <p className="text-gray-400 text-sm">{order.title}</p>
                        </div>
                        <div className="text-right">
                             <div className="text-xl font-bold text-primary mb-1">
                                {order.price > 0 ? `${order.price} ₽` : 'На расчете'}
                             </div>
                             <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getCalcOrderStatusMeta(order.status).className)}>
                                {getCalcOrderStatusMeta(order.status).label}
                             </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Детали</h3>
                        <div className="text-gray-300 whitespace-pre-wrap text-sm mb-4">
                            {JSON.parse(order.details || "{}").description || order.details}
                        </div>
                        
                        {/* Files Display */}
                        {files.length > 0 && (
                          <div className="mt-4 border-t border-slate-800 pt-4">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Прикрепленные файлы:</h4>
                            <div className="space-y-2">
                              {files.map((file: any, idx: number) => (
                                <a 
                                  key={idx}
                                  href={`/api/files/${file.fileName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700 hover:border-primary/50 transition-colors group"
                                >
                                  <div className="bg-primary/10 p-2 rounded">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                    <p className="text-sm text-gray-200 truncate group-hover:text-white">{file.originalName}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Чат с менеджером
                        </h3>
                        
                        <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-2">
                            {order.comments && order.comments.length > 0 ? (
                                order.comments.map((comment: any) => (
                                    <div key={comment.id} className={cn(
                                        "p-3 rounded-xl border max-w-[85%]",
                                        comment.user.role !== 'user' 
                                            ? "bg-slate-800/80 border-slate-700 ml-auto" 
                                            : "bg-primary/10 border-primary/20"
                                    )}>
                                        <div className="flex justify-between items-center mb-1 gap-2">
                                            <span className={cn(
                                                "font-bold text-xs",
                                                comment.user.role !== 'user' ? "text-gray-300" : "text-primary"
                                            )}>
                                                {comment.user.name}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-200">{comment.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 text-sm py-4">Нет сообщений</p>
                            )}
                        </div>

                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Написать сообщение..."
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !commentText.trim()}
                                className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <MessageSquare className="h-5 w-5" />
                            </button>
                        </form>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    {order.status === 'paid' && (
                      <button
                          onClick={handleDownloadReceipt}
                          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-lg transition-all text-sm font-bold shadow-lg shadow-primary/5"
                      >
                          <FileDown className="h-4 w-4" />
                          Скачать чек
                      </button>
                    )}
                    <button
                        onClick={handleRepeatOrder}
                        disabled={isRepeating}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        {isRepeating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Повторить заказ
                    </button>
                </div>
            </>
        ) : (
            <div className="p-6 text-center text-red-400">Не удалось загрузить заказ</div>
        )}
      </div>
    </div>
  );
}
