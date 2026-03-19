"use client";

import React, { useEffect, useState } from "react";
import { getClients, deleteClient, updateClient, ClientWithStats } from "@/app/actions/clients";
import { createChatSession } from "@/app/actions/chat";
import { MessageSquare, Trash2, Phone, Mail, User, Package, Info, X, MapPin, Edit2, Save, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { useChat } from "@/app/components/chat/chat-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export default function ClientsTable({ currentUserRole }: { currentUserRole: string }) {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  
  const { selectSession, refreshChats } = useChat();
  const router = useRouter();

  const loadClients = async () => {
    setIsLoading(true);
    const data = await getClients();
    setClients(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleEditClick = () => {
    if (!selectedClient) return;
    setEditForm({
      name: selectedClient.name || '',
      email: selectedClient.email || '',
      phone: selectedClient.phone || '',
      address: selectedClient.address || '',
      password: ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    
    // Create payload, omit password if empty
    const payload = { ...editForm };
    if (!payload.password) delete (payload as any).password;
    
    const result = await updateClient(selectedClient.id, payload, getCsrfToken());
    if (result.success) {
      // Update local state
      const updatedData = { ...editForm };
      delete (updatedData as any).password;
      
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, ...updatedData } : c));
      setSelectedClient(prev => prev ? { ...prev, ...updatedData } : null);
      setIsEditing(false);
    } else {
      alert(result.error || "Ошибка при обновлении");
    }
    setIsSaving(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleMessage = async (client: ClientWithStats) => {
    // If client has a chat session, open it.
    if (client.chatId) {
      await refreshChats();
      selectSession(client.chatId.toString());
      router.push('/admin/chat');
    } else {
        // Create new chat session for this client
        try {
            const res = await createChatSession(getCsrfToken(), undefined, client.id);
            if (res.success && res.chatId) {
                await refreshChats();
                selectSession(res.chatId.toString());
                router.push('/admin/chat');
            } else {
                alert("Не удалось создать чат с клиентом");
            }
        } catch (error) {
            console.error(error);
            alert("Ошибка при создании чата");
        }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого клиента? Все данные, включая историю заказов и переписку, будут удалены безвозвратно.")) return;
    
    const res = await deleteClient(id, getCsrfToken());
    if (res.success) {
      loadClients();
    } else {
      alert(res.error || "Ошибка при удалении клиента");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
        <p className="font-medium">Загрузка клиентов...</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="neon-card p-20 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-center">
        <User className="h-16 w-16 text-slate-800 mx-auto mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">Клиентов пока нет</h3>
        <p className="text-gray-500">Зарегистрированные пользователи появятся здесь автоматически</p>
      </div>
    );
  }

  return (
    <div className="neon-card rounded-2xl overflow-hidden border border-slate-800/50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-500 bg-slate-950 border-b border-slate-800/50">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Клиент / Контакты</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-center">Заказы</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-primary/[0.02] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary font-bold shadow-inner group-hover:border-primary/30 transition-colors">
                      {client.name ? client.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-base group-hover:text-primary transition-colors">{client.name || 'Без имени'}</div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] font-bold uppercase tracking-tight text-gray-500">
                         <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                           <Mail className="w-3 h-3 text-primary/60" />
                           {client.email}
                         </div>
                         {client.phone && (
                           <div className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer">
                             <Phone className="w-3 h-3 text-green-500/60" />
                             {client.phone}
                           </div>
                         )}
                         <div className="text-slate-700">ID: {client.id}</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <button 
                    onClick={() => router.push(`/admin/orders?clientId=${client.id}`)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      client.activeOrdersCount > 0 
                        ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 shadow-lg shadow-primary/5" 
                        : "bg-slate-900 text-gray-500 border-slate-800 hover:text-gray-400 hover:border-slate-700"
                    )}
                    title="Посмотреть заказы"
                  >
                    <Package className="w-3.5 h-3.5" />
                    {client.activeOrdersCount}
                  </button>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      onClick={() => setSelectedClient(client)}
                      variant="secondary"
                      size="sm"
                      title="Подробная информация"
                    >
                      <Info className="w-4 h-4" />
                    </Button>

                    <Button 
                      onClick={() => handleMessage(client)}
                      variant="secondary"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                      title="Написать сообщение"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    
                    {currentUserRole === 'admin' && (
                      <Button 
                        onClick={() => handleDelete(client.id)}
                        variant="secondary"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        title="Удалить клиента"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800/50 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Всего клиентов: <span className="text-white">{clients.length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
          <Package className="w-3 h-3" />
          Активных заказов: <span className="text-primary">{clients.reduce((sum, c) => sum + (c.activeOrdersCount || 0), 0)}</span>
        </div>
      </div>

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="font-semibold text-lg text-white">
                {isEditing ? 'Редактирование клиента' : 'Информация о клиенте'}
              </h3>
              <button 
                onClick={() => { setSelectedClient(null); setIsEditing(false); }}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-primary text-2xl font-bold border border-slate-700">
                    {selectedClient.name ? selectedClient.name[0].toUpperCase() : 'U'}
                 </div>
                 <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary mb-1"
                        placeholder="Имя клиента"
                      />
                    ) : (
                      <h4 className="text-xl font-medium text-white">{selectedClient.name || 'Без имени'}</h4>
                    )}
                    <p className="text-sm text-gray-400">ID: {selectedClient.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-gray-400 border border-slate-700">
                            {selectedClient.role === 'client' ? 'Клиент' : 'Пользователь'}
                        </span>
                        <span className="text-xs text-gray-500">
                            Регистрация: {new Date(selectedClient.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Контакты</h5>
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                        <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-primary mt-1" />
                            <div className="flex-1">
                                <div className="text-sm text-gray-400">Email</div>
                                {isEditing ? (
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-primary mt-1"
                                  />
                                ) : (
                                  <div className="text-white">{selectedClient.email}</div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-primary mt-1" />
                            <div className="flex-1">
                                <div className="text-sm text-gray-400">Телефон</div>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-primary mt-1"
                                    placeholder="+7..."
                                  />
                                ) : (
                                  <div className="text-white">{selectedClient.phone || 'Не указан'}</div>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                          <div className="flex items-start gap-3">
                              <User className="w-4 h-4 text-primary mt-1" />
                              <div className="flex-1">
                                  <div className="text-sm text-gray-400">Новый пароль (оставьте пустым, чтобы не менять)</div>
                                  <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-primary mt-1"
                                    placeholder="Минимум 6 символов"
                                  />
                              </div>
                          </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Доставка</h5>
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-primary mt-1" />
                            <div className="flex-1">
                                <div className="text-sm text-gray-400">Адрес доставки</div>
                                {isEditing ? (
                                  <textarea
                                    value={editForm.address}
                                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary mt-1 min-h-[80px]"
                                    placeholder="Город, улица, дом..."
                                  />
                                ) : (
                                  <div className="text-white">{(selectedClient as any).address || 'Адрес не указан'}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Сохранить
                    </button>
                  </>
                ) : (
                  <>
                    {currentUserRole === 'admin' && (
                      <button
                          onClick={handleEditClick}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                      >
                          <Edit2 className="w-4 h-4" />
                          Редактировать
                      </button>
                    )}
                    <button
                        onClick={() => setSelectedClient(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        Закрыть
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
