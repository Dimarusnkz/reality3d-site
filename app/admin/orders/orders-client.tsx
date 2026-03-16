"use client";

import React, { useState, useEffect } from "react";
import { Eye, Search, Filter, MessageSquare, X, Save, Clock, CheckCircle, Truck, DollarSign, Calendar, User, FileText, Trash2, Edit2, Download, ArrowLeft } from "lucide-react";
import { getOrderDetails, updateOrderStatus, updateOrderPrice, addOrderComment, assignOrder, getEmployees, deleteOrder, updateOrderDetails } from "@/app/actions/orders";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Ожидает", color: "text-yellow-500 bg-yellow-500/10" },
  { value: "processing", label: "В работе", color: "text-blue-500 bg-blue-500/10" },
  { value: "completed", label: "Завершен", color: "text-green-500 bg-green-500/10" },
  { value: "paid", label: "Оплачен", color: "text-purple-500 bg-purple-500/10" },
  { value: "shipped", label: "Отправлен", color: "text-indigo-500 bg-indigo-500/10" },
  { value: "cancelled", label: "Отменен", color: "text-red-500 bg-red-500/10" },
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

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setCommentText("");
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
        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", option.color)}>
            {option.label}
        </span>
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
    <div className="flex h-[calc(100vh-120px)] gap-4">
       {/* Sidebar - Order List */}
       <div className="w-full md:w-1/3 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {/* ... (sidebar content remains same) ... */}
        <div className="p-4 border-b border-slate-800 space-y-4">
            {clientIdParam && (
                <div className="mb-2 bg-primary/10 p-3 rounded-lg border border-primary/20">
                    <button 
                        onClick={handleClearClientFilter}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium w-full"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад ко всем заказам
                    </button>
                    <div className="text-xs text-gray-400 mt-1 pl-6">
                        Показаны заказы клиента #{clientIdParam}
                    </div>
                </div>
            )}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Поиск заказа..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                  onClick={() => setStatusFilter("all")}
                  className={cn("px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors", statusFilter === "all" ? "bg-primary text-white" : "bg-slate-800 text-gray-400 hover:text-white")}
                >
                  Все
                </button>
                {STATUS_OPTIONS.map(opt => (
                    <button 
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={cn("px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors", statusFilter === opt.value ? "bg-primary text-white" : "bg-slate-800 text-gray-400 hover:text-white")}
                    >
                      {opt.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    Заказы не найдены
                </div>
            ) : (
                filteredOrders.map(order => (
                    <div 
                        key={order.id}
                        onClick={() => handleOpenOrder(order.id)}
                        className={cn(
                            "p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors",
                            selectedOrder?.id === order.id ? "bg-slate-800/80 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white">#{order.id}</span>
                            {getStatusBadge(order.status)}
                        </div>
                        <div className="text-sm text-gray-300 mb-1">{order.user?.name || "Без имени"}</div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            {order.assignedTo && (
                                <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px] text-gray-400">
                                    {order.assignedTo.name.split(' ')[0]}
                                </span>
                            )}
                            {order.price && (
                                <span className="text-primary font-medium">{order.price} ₽</span>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
       </div>

       {/* Main Area - Order Details */}
       <div className="hidden md:flex flex-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex-col relative">
          {!selectedOrder && !isLoadingDetails && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <FileText className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Выберите заказ</p>
              </div>
          )}

          {isLoadingDetails && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
          )}

          {selectedOrder && (
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/80">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {isEditing ? (
                                <input 
                                    value={editData.title}
                                    onChange={e => setEditData({...editData, title: e.target.value})}
                                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-bold text-xl"
                                />
                            ) : (
                                <h2 className="text-2xl font-bold text-white">Заказ #{selectedOrder.id}</h2>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(selectedOrder.createdAt).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {selectedOrder.user?.name}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                         {/* Status Dropdown - Admin & Manager */}
                         {['admin', 'manager'].includes(currentUserRole) ? (
                            <div className="flex flex-col gap-2 items-end">
                                <select 
                                    value={selectedOrder.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary min-w-[140px]"
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>

                                {/* Assignment Dropdown */}
                                <select 
                                    value={selectedOrder.assignedTo?.id || "unassigned"}
                                    onChange={(e) => handleAssignChange(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary min-w-[140px]"
                                >
                                    <option value="unassigned">Не назначен</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                                    ))}
                                </select>
                            </div>
                         ) : (
                            <div className="flex flex-col gap-2 items-end">
                                {getStatusBadge(selectedOrder.status)}
                                {selectedOrder.assignedTo && (
                                    <span className="text-xs text-gray-400">
                                        Исполнитель: <span className="text-white">{selectedOrder.assignedTo.name}</span>
                                    </span>
                                )}
                            </div>
                         )}

                         {/* Price Input - Admin only */}
                         {currentUserRole === 'admin' ? (
                             <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        className="w-24 bg-slate-950 border border-slate-800 text-white text-sm rounded-lg pl-2 pr-1 py-1 focus:outline-none focus:border-primary text-right"
                                        placeholder="Цена"
                                    />
                                    <span className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₽</span>
                                </div>
                                <button 
                                    onClick={handlePriceSave}
                                    className="p-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
                                    title="Сохранить цену"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                             </div>
                         ) : (
                             selectedOrder.price && <div className="text-xl font-bold text-primary">{selectedOrder.price} ₽</div>
                         )}
                         
                         {/* Admin Controls */}
                         {currentUserRole === 'admin' && (
                             <div className="flex gap-2 mt-2">
                               {isEditing ? (
                                 <>
                                   <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400 text-xs flex items-center gap-1">
                                     <Save className="w-3 h-3" /> Сохранить
                                   </button>
                                   <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-400 text-xs">
                                     Отмена
                                   </button>
                                 </>
                               ) : (
                                 <>
                                   <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-400 text-xs flex items-center gap-1">
                                     <Edit2 className="w-3 h-3" /> Ред.
                                   </button>
                                   <button onClick={handleDeleteOrder} className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1">
                                     <Trash2 className="w-3 h-3" /> Удалить
                                   </button>
                                 </>
                               )}
                             </div>
                         )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Клиент</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-500">Имя:</span> <span className="text-white ml-2">{selectedOrder.user?.name}</span></p>
                                <p><span className="text-gray-500">Email:</span> <span className="text-white ml-2">{selectedOrder.user?.email}</span></p>
                                <p><span className="text-gray-500">Телефон:</span> <span className="text-white ml-2">{selectedOrder.user?.phone || "-"}</span></p>
                                <p><span className="text-gray-500">Адрес:</span> <span className="text-white ml-2">{selectedOrder.user?.address || "-"}</span></p>
                            </div>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Детали заказа</h3>
                            {isEditing ? (
                              <textarea 
                                value={editData.description}
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-sm text-white h-32"
                              />
                            ) : (
                              <div className="text-sm text-gray-300 whitespace-pre-wrap mb-4">
                                  {getOrderDescription(selectedOrder) || "Нет дополнительных деталей"}
                              </div>
                            )}
                            
                            {/* Files */}
                            {(isEditing ? editData.files : getOrderFiles(selectedOrder)).length > 0 && (
                              <div className="border-t border-slate-800 pt-3 mt-3">
                                <h4 className="text-xs font-medium text-gray-500 mb-2">Файлы:</h4>
                                <div className="space-y-2">
                                  {(isEditing ? editData.files : getOrderFiles(selectedOrder)).map((file: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between gap-2">
                                        <a 
                                          href={`/api/files/${file.fileName}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                          <FileText className="w-4 h-4" />
                                          {file.originalName} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                          <Download className="w-3 h-3 ml-1 opacity-50" />
                                        </a>
                                        {isEditing && (
                                            <button 
                                                onClick={() => handleRemoveFile(file.fileName)}
                                                className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                                title="Удалить файл"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Комментарии
                        </h3>
                        
                        <div className="space-y-4 mb-6">
                            {selectedOrder.comments && selectedOrder.comments.length > 0 ? (
                                selectedOrder.comments.map((comment: any) => (
                                    <div key={comment.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white text-sm">{comment.user.name}</span>
                                                <span className="text-[10px] bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded uppercase">
                                                    {comment.user.role === 'user' ? 'Клиент' : comment.user.role}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300">{comment.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic">Нет комментариев</p>
                            )}
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Написать комментарий..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary resize-none h-20 mb-2"
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmittingComment || !commentText.trim()}
                                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmittingComment ? "Отправка..." : "Отправить"}
                                </button>
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
