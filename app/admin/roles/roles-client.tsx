"use client";

import { useMemo, useState } from "react";
import { createAccessGroup, setUserPermissionOverride, setUserRole, updateUserGroup } from "@/app/actions/access-admin";
import { Loader2, Plus } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type UserRow = { id: number; email: string; name: string | null; role: string; groups: { id: number; name: string }[] };
type GroupRow = { id: number; name: string; description: string | null };
type PermissionRow = { key: string; description: string | null };

export function RolesClient({ users, groups, permissions }: { users: UserRow[]; groups: GroupRow[]; permissions: PermissionRow[] }) {
  const [selectedUserId, setSelectedUserId] = useState<number>(users[0]?.id || 0);
  const [role, setRole] = useState<string>(users[0]?.role || "user");
  const [groupId, setGroupId] = useState<number>(groups[0]?.id || 0);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [permKey, setPermKey] = useState<string>(permissions[0]?.key || "");
  const [permAllow, setPermAllow] = useState<"inherit" | "allow" | "deny">("inherit");
  const [isBusy, setIsBusy] = useState(false);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const selected = userMap.get(selectedUserId);

  const syncRole = (id: number) => {
    const u = userMap.get(id);
    setRole(u?.role || "user");
  };

  const updateRole = async () => {
    setIsBusy(true);
    try {
      const res = await setUserRole({ userId: selectedUserId, role }, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const addToGroup = async () => {
    if (!groupId) return;
    setIsBusy(true);
    try {
      const res = await updateUserGroup({ userId: selectedUserId, groupId, action: "add" }, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const removeFromGroup = async (gid: number) => {
    setIsBusy(true);
    try {
      const res = await updateUserGroup({ userId: selectedUserId, groupId: gid, action: "remove" }, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setIsBusy(true);
    try {
      const res = await createAccessGroup({ name: groupName, description: groupDesc || null }, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  const saveOverride = async () => {
    if (!permKey) return;
    setIsBusy(true);
    try {
      const allow = permAllow === "inherit" ? null : permAllow === "allow";
      const res = await setUserPermissionOverride({ userId: selectedUserId, permissionKey: permKey, allow }, getCsrfToken());
      if (!res.ok) alert(res.error || "Ошибка");
      else window.location.reload();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold text-lg">Пользователь</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Выбор</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedUserId(id);
                syncRole(id);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email} {u.name ? `— ${u.name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Роль</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              <option value="user">Клиент</option>
              <option value="warehouse">Склад</option>
              <option value="engineer">Инженер</option>
              <option value="manager">Менеджер</option>
              <option value="accountant">Бухгалтер</option>
              <option value="admin">Админ</option>
            </select>
          </div>
          <button
            onClick={updateRole}
            disabled={isBusy}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Сохранить роль
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold text-lg">Группы</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Добавить в группу</label>
            <select value={groupId} onChange={(e) => setGroupId(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <button onClick={addToGroup} disabled={isBusy} className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-800 px-6 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Добавить
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-2">Текущие группы пользователя</div>
          {selected?.groups.length ? (
            <div className="flex flex-wrap gap-2">
              {selected.groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => removeFromGroup(g.id)}
                  disabled={isBusy}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs disabled:opacity-50"
                  title="Удалить из группы"
                >
                  {g.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">Нет групп</div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="text-sm text-gray-400 mb-2">Создать группу</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Название</label>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Описание</label>
              <input value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
            <button onClick={createGroup} disabled={isBusy} className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Создать
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-white font-semibold text-lg">Индивидуальные права</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Permission</label>
            <select value={permKey} onChange={(e) => setPermKey(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xs">
              {permissions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.key} {p.description ? `— ${p.description}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Режим</label>
            <select value={permAllow} onChange={(e) => setPermAllow(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white">
              <option value="inherit">Наследовать</option>
              <option value="allow">Разрешить</option>
              <option value="deny">Запретить</option>
            </select>
          </div>
          <button onClick={saveOverride} disabled={isBusy} className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-800 px-6 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

