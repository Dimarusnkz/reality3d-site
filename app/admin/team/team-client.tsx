"use client";

import { useState } from "react";
import { Plus, Shield, User, Wrench, X, Truck, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { createUser, updateUser } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

interface UserType {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  admin: { label: "Администратор", icon: Shield, color: "text-red-400", bg: "bg-red-500/10" },
  manager: { label: "Менеджер", icon: User, color: "text-blue-400", bg: "bg-blue-500/10" },
  engineer: { label: "Инженер", icon: Wrench, color: "text-orange-400", bg: "bg-orange-500/10" },
  warehouse: { label: "Склад", icon: Package, color: "text-purple-400", bg: "bg-purple-500/10" },
  delivery: { label: "Доставка", icon: Truck, color: "text-green-400", bg: "bg-green-500/10" },
  user: { label: "Клиент", icon: User, color: "text-gray-400", bg: "bg-gray-500/10" },
};

export default function TeamClient({ users }: { users: UserType[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "manager",
    password: "",
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "manager", password: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name || "", 
      email: user.email, 
      role: user.role, 
      password: "", 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    data.append('csrf_token', getCsrfToken());
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("role", formData.role);
    if (formData.password) {
        data.append("password", formData.password);
    }

    try {
        if (editingUser) {
            await updateUser(editingUser.id, data);
        } else {
            await createUser(data);
        }
        setIsModalOpen(false);
        router.refresh();
    } catch (error) {
        console.error(error);
        alert("Ошибка при сохранении");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Сотрудники</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Team & Access Management</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          Новый сотрудник
        </button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <div key={user.id} className="group flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner", ROLE_CONFIG[user.role]?.bg || "bg-gray-800")}>
                {ROLE_CONFIG[user.role]?.icon ? (
                    <div className={ROLE_CONFIG[user.role]?.color}>
                        {(() => {
                            const Icon = ROLE_CONFIG[user.role].icon;
                            return <Icon className="h-5 w-5" />;
                        })()}
                    </div>
                ) : <User className="h-5 w-5 text-gray-400" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight group-hover:text-primary transition-colors">{user.name || "Без имени"}</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 relative z-10">
               <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-slate-800 bg-slate-950/50 text-gray-400 shadow-inner")}>
                 {ROLE_CONFIG[user.role]?.label || user.role}
               </span>
               <button 
                 onClick={() => handleOpenEdit(user)}
                 className="text-[10px] font-black text-gray-500 hover:text-primary transition-colors uppercase tracking-[0.2em]"
               >
                 Редактировать
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-6">
              {editingUser ? "Редактировать сотрудника" : "Новый сотрудник"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Имя</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Роль</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                >
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    {editingUser ? "Новый пароль (оставьте пустым, если не меняете)" : "Пароль"}
                </label>
                <input 
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full neon-button mt-4 disabled:opacity-50"
              >
                {isLoading ? "Сохранение..." : (editingUser ? "Сохранить" : "Создать")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
