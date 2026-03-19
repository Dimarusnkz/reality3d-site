"use client";

import { useMemo, useState } from "react";
import { 
  createAccessGroup, 
  setUserPermissionOverride, 
  setUserRole, 
  updateUserGroup, 
  updateGroupPermission,
  deleteAccessGroup
} from "@/app/actions/access-admin";
import { Loader2, Plus, Shield, User as UserIcon, Users, Trash2, CheckCircle2, XCircle, Info, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type UserRow = { 
  id: number; 
  email: string; 
  name: string | null; 
  role: string; 
  groups: { id: number; name: string }[];
  overrides: { key: string; allow: boolean }[];
};
type GroupRow = { 
  id: number; 
  name: string; 
  description: string | null;
  permissions: string[];
};
type PermissionRow = { key: string; description: string | null };

export function RolesClient({ users, groups, permissions }: { users: UserRow[]; groups: GroupRow[]; permissions: PermissionRow[] }) {
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [selectedUserId, setSelectedUserId] = useState<number>(users[0]?.id || 0);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(groups[0]?.id || 0);
  
  // States for user management
  const [role, setRole] = useState<string>(users.find(u => u.id === selectedUserId)?.role || "user");
  const [targetGroupId, setTargetGroupId] = useState<number>(groups[0]?.id || 0);
  const [permKey, setPermKey] = useState<string>(permissions[0]?.key || "");
  const [permAllow, setPermAllow] = useState<"inherit" | "allow" | "deny">("inherit");

  // States for group management
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [targetGroupPermKey, setTargetGroupPermKey] = useState<string>(permissions[0]?.key || "");

  const [isBusy, setIsBusy] = useState(false);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  const selectedUser = userMap.get(selectedUserId);
  const selectedGroup = groupMap.get(selectedGroupId);

  const handleUserChange = (id: number) => {
    setSelectedUserId(id);
    setRole(userMap.get(id)?.role || "user");
  };

  const runAction = async (action: () => Promise<any>) => {
    setIsBusy(true);
    try {
      const res = await action();
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } catch (e) {
      alert("Произошла ошибка");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit backdrop-blur-sm">
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
            activeTab === "users" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"
          )}
        >
          <UserIcon className="h-3.5 w-3.5" />
          Пользователи
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
            activeTab === "groups" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Группы доступа
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar / Selection List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="neon-card border border-slate-800 bg-slate-900/40 rounded-3xl overflow-hidden flex flex-col max-h-[700px]">
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {activeTab === "users" ? "Список сотрудников" : "Группы доступа"}
              </h2>
              {activeTab === "groups" && (
                <button 
                  onClick={() => {
                    const name = prompt("Название новой группы:");
                    if (name) runAction(() => createAccessGroup({ name }, getCsrfToken()));
                  }}
                  className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {activeTab === "users" ? (
                users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleUserChange(u.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group",
                      selectedUserId === u.id 
                        ? "bg-primary/10 border-primary/30 text-white shadow-lg shadow-primary/5" 
                        : "border-transparent text-gray-500 hover:bg-slate-800/50 hover:text-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5",
                      selectedUserId === u.id ? "bg-primary/20 text-primary" : "bg-slate-950 text-gray-700"
                    )}>
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-black truncate uppercase tracking-tight">{u.name || "Без имени"}</div>
                      <div className="text-[10px] font-bold opacity-50 truncate tracking-widest">{u.role}</div>
                    </div>
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", selectedUserId === u.id ? "rotate-0 text-primary" : "rotate-0 opacity-0 group-hover:opacity-100")} />
                  </button>
                ))
              ) : (
                groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group",
                      selectedGroupId === g.id 
                        ? "bg-primary/10 border-primary/30 text-white shadow-lg shadow-primary/5" 
                        : "border-transparent text-gray-500 hover:bg-slate-800/50 hover:text-gray-300"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5",
                      selectedGroupId === g.id ? "bg-primary/20 text-primary" : "bg-slate-950 text-gray-700"
                    )}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-black truncate uppercase tracking-tight">{g.name}</div>
                      <div className="text-[10px] font-bold opacity-50 truncate tracking-widest">{g.permissions.length} прав</div>
                    </div>
                    <ChevronRight className={cn("ml-auto h-4 w-4 transition-transform", selectedGroupId === g.id ? "rotate-0 text-primary" : "rotate-0 opacity-0 group-hover:opacity-100")} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === "users" && selectedUser ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* User Header */}
              <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Lock className="h-20 w-20 text-primary" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <UserIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUser.name || "Без имени"}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Basic Role Selection */}
              <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/20 space-y-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Основная роль</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="md:col-span-2 w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  >
                    <option value="user">Клиент (User)</option>
                    <option value="warehouse">Кладовщик (Warehouse)</option>
                    <option value="engineer">Инженер (Engineer)</option>
                    <option value="manager">Менеджер (Manager)</option>
                    <option value="accountant">Бухгалтер (Accountant)</option>
                    <option value="admin">Администратор (Admin)</option>
                  </select>
                  <button
                    onClick={() => runAction(() => setUserRole({ userId: selectedUserId, role }, getCsrfToken()))}
                    disabled={isBusy}
                    className="w-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 disabled:opacity-50"
                  >
                    Обновить роль
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-medium">Роль определяет базовый набор прав, которые можно расширить группами или индивидуально.</p>
              </div>

              {/* Access Groups */}
              <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/20 space-y-6">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Группы доступа</h4>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {selectedUser.groups.map(g => (
                    <div key={g.id} className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl group/tag hover:border-red-500/30 transition-all">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{g.name}</span>
                      <button 
                        onClick={() => runAction(() => updateUserGroup({ userId: selectedUserId, groupId: g.id, action: "remove" }, getCsrfToken()))}
                        className="p-1 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {selectedUser.groups.length === 0 && (
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest italic">Нет назначенных групп</div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/30">
                  <select 
                    value={targetGroupId} 
                    onChange={(e) => setTargetGroupId(Number(e.target.value))}
                    className="md:col-span-2 w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  >
                    {groups.filter(g => !selectedUser.groups.find(ug => ug.id === g.id)).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => runAction(() => updateUserGroup({ userId: selectedUserId, groupId: targetGroupId, action: "add" }, getCsrfToken()))}
                    disabled={isBusy || groups.filter(g => !selectedUser.groups.find(ug => ug.id === g.id)).length === 0}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 transition-all duration-300 disabled:opacity-30"
                  >
                    Добавить группу
                  </button>
                </div>
              </div>

              {/* Individual Overrides */}
              <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/20 space-y-6">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-purple-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Индивидуальные права</h4>
                </div>

                <div className="grid gap-3">
                  {selectedUser.overrides.map(ov => (
                    <div key={ov.key} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                        {ov.allow ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        <span className="text-[10px] font-mono text-gray-400">{ov.key}</span>
                      </div>
                      <button 
                        onClick={() => runAction(() => setUserPermissionOverride({ userId: selectedUserId, permissionKey: ov.key, allow: null }, getCsrfToken()))}
                        className="text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-widest"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                  {selectedUser.overrides.length === 0 && (
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest italic text-center py-4 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                      Нет индивидуальных исключений
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/30">
                  <select 
                    value={permKey} 
                    onChange={(e) => setPermKey(e.target.value)}
                    className="md:col-span-2 w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-xs font-mono focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  >
                    {permissions.map(p => (
                      <option key={p.key} value={p.key}>{p.key}</option>
                    ))}
                  </select>
                  <select 
                    value={permAllow} 
                    onChange={(e) => setPermAllow(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-xs focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  >
                    <option value="allow">Разрешить</option>
                    <option value="deny">Запретить</option>
                  </select>
                  <button
                    onClick={() => runAction(() => setUserPermissionOverride({ 
                      userId: selectedUserId, 
                      permissionKey: permKey, 
                      allow: permAllow === "allow" 
                    }, getCsrfToken()))}
                    disabled={isBusy}
                    className="w-full bg-slate-950 border border-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 transition-all duration-300"
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === "groups" && selectedGroup ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Group Header */}
              <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users className="h-20 w-20 text-blue-400" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                      <Shield className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedGroup.name}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{selectedGroup.description || "Без описания"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm("Удалить группу? Все участники будут исключены.")) {
                        runAction(() => deleteAccessGroup(selectedGroupId, getCsrfToken()));
                      }
                    }}
                    className="p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Group Permissions */}
              <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/20 space-y-6">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-blue-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Права группы</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedGroup.permissions.map(pKey => (
                    <div key={pKey} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl group/item">
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-[10px] font-mono text-gray-400 truncate" title={pKey}>{pKey}</span>
                      </div>
                      <button 
                        onClick={() => runAction(() => updateGroupPermission({ 
                          groupId: selectedGroupId, 
                          permissionKey: pKey, 
                          action: "remove" 
                        }, getCsrfToken()))}
                        className="p-1 text-gray-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {selectedGroup.permissions.length === 0 && (
                    <div className="md:col-span-2 text-center py-10 bg-slate-950/20 rounded-3xl border border-dashed border-slate-800">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Группа пока не имеет прав</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-slate-800/30">
                  <select 
                    value={targetGroupPermKey} 
                    onChange={(e) => setTargetGroupPermKey(e.target.value)}
                    className="md:col-span-3 w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-xs font-mono focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                  >
                    {permissions.filter(p => !selectedGroup.permissions.includes(p.key)).map(p => (
                      <option key={p.key} value={p.key}>{p.key} — {p.description}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => runAction(() => updateGroupPermission({ 
                      groupId: selectedGroupId, 
                      permissionKey: targetGroupPermKey, 
                      action: "add" 
                    }, getCsrfToken()))}
                    disabled={isBusy || permissions.filter(p => !selectedGroup.permissions.includes(p.key)).length === 0}
                    className="w-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-30"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-32 bg-slate-900/10 rounded-[3rem] border border-dashed border-slate-800/50">
              <Info className="h-12 w-12 text-slate-800 mb-6" />
              <p className="text-gray-600 font-black uppercase tracking-widest text-xs italic">Выберите объект для настройки</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
