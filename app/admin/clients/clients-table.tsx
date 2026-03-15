"use client";

import React, { useEffect, useState } from "react";
import { getClients, deleteClient, updateClient, ClientWithStats } from "@/app/actions/clients";
import { createChatSession } from "@/app/actions/chat";
import { MessageSquare, Trash2, Phone, Mail, User, Package, Info, X, MapPin, Edit2, Save, Loader2 } from "lucide-react";
import { useChat } from "@/app/components/chat/chat-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ClientsTable({ currentUserRole }: { currentUserRole: string }) {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });
  
  const { selectSession, openChat, refreshChats } = useChat();
  const router = useRouter();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    const data = await getClients();
    setClients(data);
    setIsLoading(false);
  };

  const handleEditClick = () => {
    if (!selectedClient) return;
    setEditForm({
      name: selectedClient.name || '',
      email: selectedClient.email || '',
      phone: selectedClient.phone || '',
      address: selectedClient.address || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    const result = await updateClient(selectedClient.id, editForm);
    if (result.success) {
      // Update local state
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, ...editForm } : c));
      setSelectedClient(prev => prev ? { ...prev, ...editForm } : null);
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
            const res = await createChatSession(undefined, client.id);
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
    if (!confirm("Вы уверены, что хотите удалить этого клиента? Это действие необратимо.")) return;
    
    const res = await deleteClient(id);
    if (res.success) {
      loadClients();
    } else {
      alert("Ошибка при удалении клиента");
    }
  };

  if (isLoading) {
    return <div className="text-gray-400">Загрузка клиентов...</div>;
  }

  if (clients.length === 0) {
    return <div className="text-gray-400">Клиентов пока нет.</div>;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
          <tr>
            <th className="p-4 font-medium">Клиент / Контакты</th>
            <th className="p-4 font-medium text-center">Заказы в работе</th>
            <th className="p-4 font-medium text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold border border-slate-700 shrink-0">
                    {client.name ? client.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-white">{client.name || 'Без имени'}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                       <div className="flex items-center gap-1.5">
                         <Mail className="w-3 h-3" />
                         {client.email}
                       </div>
                       {client.phone && (
                         <div className="flex items-center gap-1.5 text-gray-300">
                           <Phone className="w-3 h-3" />
                           {client.phone}
                         </div>
                       )}
                       <span className="text-slate-600">|</span>
                       <span>ID: {client.id}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-center">
                <div 
                    onClick={() => router.push(`/admin/orders?clientId=${client.id}`)}
                    className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:scale-105 transition-transform",
                    client.activeOrdersCount > 0 ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" : "bg-slate-800 text-gray-500 hover:bg-slate-700"
                )} title="Посмотреть заказы">
                    <Package className="w-3 h-3" />
                    {client.activeOrdersCount}
                </div>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => setSelectedClient(client)}
                    className="p-2 text-gray-400 hover:bg-gray-400/10 rounded-lg transition-colors"
                    title="Подробная информация"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => handleMessage(client)}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="Написать сообщение"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  
                  {currentUserRole === 'admin' && (
                    <button 
                      onClick={() => handleDelete(client.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Удалить клиента"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
