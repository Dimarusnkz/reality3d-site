"use client";

import React, { useState, useEffect } from "react";
import { Search, MessageSquare, X, Save, Calendar, User, FileText, Trash2, Edit2, Download, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { getOrderDetails, updateOrderStatus, updateOrderPrice, addOrderComment, assignOrder, getEmployees, deleteOrder, updateOrderDetails, confirmOrderPaymentAdmin } from "@/app/actions/orders";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "pending", label: "В обработке", variant: "warning" as const },
  { value: "processing", label: "В работе", variant: "info" as const },
  { value: "payment_pending", label: "Ожидает оплаты", variant: "warning" as const },
  { value: "paid", label: "Оплачен", variant: "success" as const },
  { value: "in_production", label: "В производстве", variant: "info" as const },
  { value: "ready", label: "Готов", variant: "success" as const },
  { value: "shipped", label: "Отправлен", variant: "info" as const },
  { value: "completed", label: "Завершен", variant: "secondary" as const },
  { value: "cancelled", label: "Отменен", variant: "error" as const },
];

export default function OrdersClient({ initialOrders, currentUserRole }: { initialOrders: any[], currentUserRole: string }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editPrice, setEditPrice] = useState<string>("");
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{title: string, description: string, files: any[]}>({ title: "", description: "", files: [] });

  const [confirmBusy, setConfirmBusy] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const clientIdParam = searchParams.get('clientId');

  useEffect(() => {
    if (['admin', 'manager'].includes(currentUserRole)) {
        getEmployees().then(setEmployees);
    }
  }, [currentUserRole]);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = orders.filter(order => {
     const matchesClient = !clientIdParam || order.userId === parseInt(clientIdParam);
     const matchesSearch = (order.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                           order.id.toString().includes(searchTerm);
     const matchesStatus = statusFilter === "all" || order.status === statusFilter;
     return matchesSearch && matchesStatus && matchesClient;
  });

  const handleConfirmPayment = async () => {
    if (!selectedOrder || !confirm("Подтвердить оплату этого заказа?")) return;
    setConfirmBusy(true);
    const res = await confirmOrderPaymentAdmin(selectedOrder.id, getCsrfToken());
    if (res.success) {
      const updatedOrder = { ...selectedOrder, status: 'paid' };
      setSelectedOrder(updatedOrder);
      setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
    } else {
      alert("Ошибка подтверждения оплаты");
    }
    setConfirmBusy(false);
  };

  const handleClearClientFilter = () => {
    router.push('/admin/orders');
  };

  const handleOpenOrder = async (orderId: number) => {
    setIsLoadingDetails(true);
    // Optimistically open modal if we have data, but fetch details for comments
    const orderPreview = orders.find(o => o.id === orderId);
    if (orderPreview) {
        setEditPrice(orderPreview.price?.toString() || "");
    }
    
    const details = await getOrderDetails(orderId);
    setSelectedOrder(details);
    if (details) {
        setEditPrice(details.price?.toString() || "");
        const parsed = JSON.parse(details.details || "{}");
        setEditData({ 
          title: details.title || "", 
          description: parsed.description || "",
          files: parsed.files || []
        });
    }
    setIsLoadingDetails(false);
    setIsEditing(false);
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder || !confirm("Вы уверены, что хотите удалить этот заказ?")) return;
    
    const res = await deleteOrder(selectedOrder.id, getCsrfToken());
    if (res.success) {
      setOrders(orders.filter(o => o.id !== selectedOrder.id));
      setSelectedOrder(null);
    } else {
      alert("Ошибка удаления заказа");
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setEditData(prev => ({
      ...prev,
      files: prev.files.filter(f => f.fileName !== fileName)
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    
    const parsed = JSON.parse(selectedOrder.details || "{}");
    const newDetails = { ...parsed, description: editData.description, files: editData.files };
    
    const res = await updateOrderDetails(
      selectedOrder.id,
      {
        title: editData.title,
        details: newDetails,
      },
      getCsrfToken()
    );

    if (res.success) {
      const updatedOrder = { 
        ...selectedOrder, 
        title: editData.title, 
        details: JSON.stringify(newDetails) 
      };
      setSelectedOrder(updatedOrder);
      setOrders(orders.map(o => o.id === selectedOrder.id ? updatedOrder : o));
      setIsEditing(false);
    } else {
      alert("Ошибка обновления заказа");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    const res = await updateOrderStatus(selectedOrder.id, newStatus, getCsrfToken());
    if (res.success) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
    } else {
      alert("Ошибка обновления статуса");
    }
  };

  const handlePriceSave = async () => {
    if (!selectedOrder) return;
    const price = parseFloat(editPrice);
    if (isNaN(price)) return;

    const res = await updateOrderPrice(selectedOrder.id, price, getCsrfToken());
    if (res.success) {
      setSelectedOrder({ ...selectedOrder, price: price });
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, price: price } : o));
    } else {
      alert("Ошибка обновления цены");
    }
  };

  const handleAssignChange = async (employeeId: string) => {
    if (!selectedOrder) return;
    const id = employeeId === "unassigned" ? null : parseInt(employeeId);
    
    const res = await assignOrder(selectedOrder.id, id, getCsrfToken());
    if (res.success) {
        // Optimistically update
        const assignedEmployee = employees.find(e => e.id === id) || null;
        setSelectedOrder({ ...selectedOrder, assignedToId: id, assignedTo: assignedEmployee });
        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, assignedTo: assignedEmployee } : o));
    } else {
        alert("Ошибка назначения сотрудника");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedOrder) return;
    
    setIsSubmittingComment(true);
    const res = await addOrderComment(selectedOrder.id, commentText, getCsrfToken());
    if (res.success) {
        // Refresh details to get the new comment with user info
        const updatedDetails = await getOrderDetails(selectedOrder.id);
        setSelectedOrder(updatedDetails);
        setCommentText("");
    } else {
        alert("Ошибка отправки комментария");
    }
    setIsSubmittingComment(false);
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
    return (
        <Badge variant={option.variant}>
            {option.label}
        </Badge>
    );
  };

  // Helper to extract files safely
  const getOrderFiles = (order: any) => {
    try {
      const details = JSON.parse(order.details || "{}");
      return details.files || [];
    } catch { return []; }
  };
  
  const getOrderDescription = (order: any) => {
    try {
      return JSON.parse(order.details || "{}").description || order.details;
    } catch { return order.details; }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
       {/* Sidebar - Order List */}
       <div className="w-full md:w-[380px] neon-card border border-slate-800/50 rounded-2xl flex flex-col overflow-hidden bg-slate-900/20">
        <div className="p-5 border-b border-slate-800/50 space-y-5 bg-slate-950/30">
            {clientIdParam && (
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                    <button 
                        onClick={handleClearClientFilter}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-all w-full"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Все заказы
                    </button>
                    <div className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tight pl-6">
                        Клиент #{clientIdParam}
                    </div>
                </div>
            )}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Поиск заказа или клиента..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button 
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border", 
                    statusFilter === "all" 
                      ? "bg-primary/10 text-primary border-primary/30 shadow-lg shadow-primary/5" 
                      : "bg-slate-900 text-gray-500 border-slate-800 hover:text-gray-300"
                  )}
                >
                  Все
                </button>
                {STATUS_OPTIONS.map(opt => (
                    <button 
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap", 
                        statusFilter === opt.value 
                          ? "bg-primary/10 text-primary border-primary/30 shadow-lg shadow-primary/5" 
                          : "bg-slate-900 text-gray-500 border-slate-800 hover:text-gray-300"
                      )}
                    >
                      {opt.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-800/30">
            {filteredOrders.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                      <Search className="w-6 h-6 text-gray-700" />
                    </div>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Не найдено</p>
                </div>
            ) : (
                filteredOrders.map(order => (
                    <div 
                        key={order.id}
                        onClick={() => handleOpenOrder(order.id)}
                        className={cn(
                            "p-5 cursor-pointer hover:bg-primary/[0.03] transition-all relative group",
                            selectedOrder?.id === order.id ? "bg-primary/[0.05]" : ""
                        )}
                    >
                        {selectedOrder?.id === order.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(255,94,0,0.5)]"></div>
                        )}
                        <div className="flex justify-between items-start mb-3">
                            <span className="font-black text-white text-lg tracking-tighter">#{order.id}</span>
                            {getStatusBadge(order.status)}
                        </div>
                        <div className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors truncate mb-3">
                          {order.user?.name || "Без имени"}
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 opacity-50" />
                              {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                            <div className="flex items-center gap-3">
                              {order.assignedTo && (
                                  <span className="bg-slate-800 px-2 py-0.5 rounded text-gray-400 border border-slate-700">
                                      {order.assignedTo.name.split(' ')[0]}
                                  </span>
                              )}
                              {order.price && (
                                  <span className="text-primary font-black text-sm tracking-tight">{order.price.toLocaleString()} ₽</span>
                              )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
       </div>

       {/* Main Area - Order Details */}
       <div className="hidden md:flex flex-1 neon-card border border-slate-800/50 rounded-2xl overflow-hidden flex-col relative bg-slate-900/10">
          {!selectedOrder && !isLoadingDetails && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-20 text-center">
                  <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                    <FileText className="h-10 w-10 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Выберите заказ</h3>
                  <p className="text-sm text-gray-600 max-w-[280px]">Выберите любой заказ из списка слева для просмотра деталей и управления</p>
              </div>
          )}

          {isLoadingDetails && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm z-50">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary animate-pulse">Загрузка данных...</p>
              </div>
          )}

          {selectedOrder && (
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-800/50 flex justify-between items-start bg-slate-950/40">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <input 
                                    value={editData.title}
                                    onChange={e => setEditData({...editData, title: e.target.value})}
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-xl focus:border-primary outline-none"
                                />
                            ) : (
                                <h2 className="text-2xl font-black text-white tracking-tight">Заказ #{selectedOrder.id}</h2>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                                <Calendar className="w-3 h-3 text-primary/60" />
                                {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                                <User className="w-3 h-3 text-blue-400/60" />
                                {selectedOrder.user?.name}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                         {/* Status & Assignment - Admin & Manager */}
                         {['admin', 'manager'].includes(currentUserRole) ? (
                            <div className="flex items-center gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Статус</label>
                                  <select 
                                      value={selectedOrder.status}
                                      onChange={(e) => handleStatusChange(e.target.value)}
                                      className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2 focus:border-primary outline-none min-w-[140px] appearance-none cursor-pointer"
                                  >
                                      {STATUS_OPTIONS.map(opt => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Исполнитель</label>
                                  <select 
                                      value={selectedOrder.assignedTo?.id || "unassigned"}
                                      onChange={(e) => handleAssignChange(e.target.value)}
                                      className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-2 focus:border-primary outline-none min-w-[140px] appearance-none cursor-pointer"
                                  >
                                      <option value="unassigned">Не назначен</option>
                                      {employees.map(emp => (
                                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                                      ))}
                                  </select>
                                </div>
                            </div>
                         ) : (
                            <div className="flex flex-col gap-2 items-end">
                                {getStatusBadge(selectedOrder.status)}
                                {selectedOrder.assignedTo && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                        Исполнитель: <span className="text-white">{selectedOrder.assignedTo.name}</span>
                                    </span>
                                )}
                            </div>
                         )}

                         <div className="flex items-center gap-4">
                            {/* Price Input - Admin only */}
                            {currentUserRole === 'admin' ? (
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                                    <input 
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        className="w-20 bg-transparent text-white text-sm font-black focus:outline-none text-right placeholder:text-gray-800"
                                        placeholder="0"
                                    />
                                    <span className="text-primary font-bold text-xs">₽</span>
                                    <button 
                                        onClick={handlePriceSave}
                                        className="ml-1 p-1 text-primary hover:text-white transition-colors"
                                        title="Сохранить цену"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                selectedOrder.price && <div className="text-2xl font-black text-primary tracking-tighter">{selectedOrder.price.toLocaleString()} ₽</div>
                            )}
                            
                            {/* Admin Controls */}
                            {currentUserRole === 'admin' && (
                                <div className="flex items-center gap-2 border-l border-slate-800 pl-4 ml-2">
                                  {selectedOrder.status === 'payment_pending' && (
                                    <Button 
                                      onClick={handleConfirmPayment} 
                                      disabled={confirmBusy}
                                      variant="primary" 
                                      size="sm" 
                                      className="h-8 px-3 text-[10px] bg-green-600 hover:bg-green-700"
                                    >
                                      {confirmBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                                      Подтвердить оплату
                                    </Button>
                                  )}
                                  {isEditing ? (
                                    <>
                                      <Button onClick={handleSaveEdit} variant="primary" size="sm" className="h-8 px-3 text-[10px]">
                                        <Save className="w-3.5 h-3.5 mr-1.5" /> Сохранить
                                      </Button>
                                      <Button onClick={() => setIsEditing(false)} variant="secondary" size="sm" className="h-8 px-3 text-[10px]">
                                        Отмена
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm" className="h-8 w-8 p-0" title="Редактировать">
                                        <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                                      </Button>
                                      <Button onClick={handleDeleteOrder} variant="secondary" size="sm" className="h-8 w-8 p-0" title="Удалить">
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                            )}
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Details */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
                            <h3 className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
                              Данные покупателя
                            </h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-gray-600 uppercase">Имя</span>
                                  <span className="text-white font-bold text-sm">{selectedOrder.user?.name || "—"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-gray-600 uppercase">Email</span>
                                  <span className="text-white font-bold text-sm">{selectedOrder.user?.email || "—"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-gray-600 uppercase">Телефон</span>
                                  <span className="text-white font-bold text-sm">{selectedOrder.user?.phone || "—"}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-bold text-gray-600 uppercase">Адрес</span>
                                  <span className="text-white font-bold text-sm leading-relaxed">{selectedOrder.user?.address || "—"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
                            <h3 className="text-[10px] font-black text-gray-500 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60"></div>
                              Параметры проекта
                            </h3>
                            {isEditing ? (
                              <textarea 
                                value={editData.description}
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-white h-40 focus:border-primary outline-none transition-all"
                                placeholder="Описание проекта..."
                              />
                            ) : (
                              <div className="text-sm text-gray-300 whitespace-pre-wrap mb-6 leading-relaxed">
                                  {getOrderDescription(selectedOrder) || "Нет дополнительных деталей"}
                              </div>
                            )}
                            
                            {/* Files */}
                            {(isEditing ? editData.files : getOrderFiles(selectedOrder)).length > 0 && (
                              <div className="border-t border-slate-800/50 pt-4 mt-4">
                                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Прикрепленные файлы:</h4>
                                <div className="space-y-2">
                                  {(isEditing ? editData.files : getOrderFiles(selectedOrder)).map((file: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800 group/file">
                                        <a 
                                          href={`/api/files/${file.fileName}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-3 text-sm text-blue-400 hover:text-blue-300 transition-colors font-bold overflow-hidden"
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                          </div>
                                          <div className="truncate">
                                            <div className="truncate">{file.originalName}</div>
                                            <div className="text-[10px] text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                          </div>
                                          <Download className="w-3 h-3 ml-1 opacity-0 group-hover/file:opacity-50 transition-opacity" />
                                        </a>
                                        {isEditing && (
                                            <Button 
                                                onClick={() => handleRemoveFile(file.fileName)}
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                                title="Удалить файл"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-slate-950/20 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
                        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Чат по заказу
                        </h3>
                        
                        <div className="space-y-4 mb-8">
                            {selectedOrder.comments && selectedOrder.comments.length > 0 ? (
                                selectedOrder.comments.map((comment: any) => (
                                    <div key={comment.id} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 relative overflow-hidden group/msg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-primary">
                                                  {comment.user.name[0].toUpperCase()}
                                                </div>
                                                <span className="font-bold text-white text-xs">{comment.user.name}</span>
                                                <Badge variant={comment.user.role === 'admin' ? 'success' : 'secondary'} className="px-1.5 py-0 text-[8px]">
                                                    {comment.user.role === 'user' ? 'Клиент' : comment.user.role}
                                                </Badge>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                                {new Date(comment.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed pl-8">{comment.text}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-30 grayscale">
                                  <MessageSquare className="w-10 h-10 mx-auto mb-3" />
                                  <p className="text-sm font-bold uppercase tracking-widest">Нет комментариев</p>
                                </div>
                            )}
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                            <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                              <textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Написать сообщение клиенту или заметку..."
                                  className="w-full bg-transparent text-sm text-white focus:outline-none resize-none h-24 placeholder:text-gray-700"
                              />
                              <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                                  <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                    {commentText.length} символов
                                  </div>
                                  <Button
                                      type="submit"
                                      disabled={isSubmittingComment || !commentText.trim()}
                                      size="sm"
                                      className="font-black uppercase tracking-[0.2em] text-[10px] h-9 px-6"
                                  >
                                      {isSubmittingComment ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        "Отправить"
                                      )}
                                  </Button>
                              </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
          )}
       </div>
    </div>
  );
}
