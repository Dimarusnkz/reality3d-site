"use client";

import { useState } from "react";
import { Plus, Search, Shield, User, Wrench, X, Mail, Lock, Ban, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = 'admin' | 'manager' | 'engineer';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const MOCK_USERS: User[] = [
  { id: 1, name: "Administrator", email: "admin@reality3d.com", role: "admin", status: "active", lastLogin: "Сейчас" },
  { id: 2, name: "Алексей Петров", email: "manager@reality3d.com", role: "manager", status: "active", lastLogin: "2 часа назад" },
  { id: 3, name: "Дмитрий Инженеров", email: "eng@reality3d.com", role: "engineer", status: "active", lastLogin: "Вчера" },
];

const ROLE_CONFIG: Record<Role, { label: string; icon: any; color: string; bg: string }> = {
  admin: { label: "Администратор", icon: Shield, color: "text-red-400", bg: "bg-red-500/10" },
  manager: { label: "Менеджер", icon: User, color: "text-blue-400", bg: "bg-blue-500/10" },
  engineer: { label: "Инженер", icon: Wrench, color: "text-orange-400", bg: "bg-orange-500/10" },
};

export default function AdminTeamPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "manager" as Role,
    password: "",
    status: "active" as 'active' | 'inactive'
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "manager", password: "", status: "active" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      password: "", // Password empty by default for security
      status: user.status 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      setUsers(users.map(u => u.id === editingUser.id ? {
        ...u,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status
      } : u));
    } else {
      // Create new user
      const newUser: User = {
        id: users.length + 1,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: "active",
        lastLogin: "Никогда"
      };
      setUsers([...users, newUser]);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Сотрудники</h1>
          <p className="text-gray-400">Управление доступом и ролями команды</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="neon-button flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить сотрудника
        </button>
      </div>

      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Поиск сотрудника..." 
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Сотрудник</th>
                <th className="px-6 py-4 font-medium">Роль</th>
                <th className="px-6 py-4 font-medium">Статус</th>
                <th className="px-6 py-4 font-medium">Последний вход</th>
                <th className="px-6 py-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role];
                const RoleIcon = roleConfig.icon;
                const isInactive = user.status === 'inactive';
                
                return (
                  <tr key={user.id} className={cn("transition-colors", isInactive ? "bg-red-900/10 hover:bg-red-900/20" : "hover:bg-slate-900/30")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold border",
                          isInactive ? "bg-red-900/20 border-red-900 text-red-500" : "bg-slate-800 border-slate-700 text-gray-400"
                        )}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className={cn("font-bold", isInactive ? "text-gray-400" : "text-white")}>{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-opacity-20",
                        isInactive ? "text-gray-500 border-gray-700 bg-gray-800/50" : roleConfig.color,
                        !isInactive && roleConfig.bg,
                        !isInactive && `border-${roleConfig.color.split('-')[1]}-500`
                      )}>
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isInactive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.lastLogin}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="text-gray-400 hover:text-white transition-colors text-xs underline"
                        >
                          Изменить
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-400 transition-colors"
                          title="Удалить сотрудника"
                        >
                          {/* <Trash2 className="h-4 w-4" /> */}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="neon-card w-full max-w-md p-6 rounded-xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-1">
              {editingUser ? 'Редактирование сотрудника' : 'Новый сотрудник'}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {editingUser ? 'Изменение данных учетной записи' : 'Создание учетной записи для доступа к системе'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">ФИО Сотрудника</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="Иван Иванов"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email (Логин)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="user@reality3d.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Роль в системе</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={cn(
                    "cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all",
                    formData.role === 'manager' 
                      ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                      : "bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700"
                  )}>
                    <input 
                      type="radio" 
                      name="role" 
                      className="hidden" 
                      checked={formData.role === 'manager'}
                      onChange={() => setFormData({...formData, role: 'manager'})}
                    />
                    <User className="h-5 w-5" />
                    <span className="text-xs font-bold">Менеджер</span>
                  </label>

                  <label className={cn(
                    "cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-all",
                    formData.role === 'engineer' 
                      ? "bg-orange-500/10 border-orange-500 text-orange-400" 
                      : "bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-700"
                  )}>
                    <input 
                      type="radio" 
                      name="role" 
                      className="hidden" 
                      checked={formData.role === 'engineer'}
                      onChange={() => setFormData({...formData, role: 'engineer'})}
                    />
                    <Wrench className="h-5 w-5" />
                    <span className="text-xs font-bold">Инженер</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {editingUser ? 'Новый пароль (оставьте пустым, если не меняете)' : 'Пароль'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input 
                    required={!editingUser}
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {editingUser && (
                <div className="pt-2 border-t border-slate-800 mt-4">
                  <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-900 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-300">Заблокировать доступ</span>
                    </div>
                    <div className={cn(
                      "w-10 h-6 rounded-full relative transition-colors",
                      formData.status === 'inactive' ? "bg-red-500" : "bg-slate-700"
                    )}
                    onClick={() => setFormData({...formData, status: formData.status === 'active' ? 'inactive' : 'active'})}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.status === 'inactive' ? "left-5" : "left-1"
                      )} />
                    </div>
                  </label>
                </div>
              )}

              <button type="submit" className="neon-button w-full mt-4">
                {editingUser ? 'Сохранить изменения' : 'Создать аккаунт'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
