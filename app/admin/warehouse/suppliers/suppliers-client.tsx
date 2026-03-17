"use client";

import { useMemo, useState } from "react";
import { createWarehouseSupplier, updateWarehouseSupplier } from "@/app/actions/warehouse-docs";
import { Loader2, Plus, Save } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Supplier = {
  id: number;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  contractNumber: string | null;
  isActive: boolean;
};

export function SuppliersClient({ initial }: { initial: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initial);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contractNumber, setContractNumber] = useState("");

  const sorted = useMemo(() => suppliers.slice().sort((a, b) => a.name.localeCompare(b.name)), [suppliers]);

  const create = async () => {
    setIsSaving(true);
    try {
      const res = await createWarehouseSupplier(
        { name, contact: contact || null, phone: phone || null, email: email || null, contractNumber: contractNumber || null, isActive: true },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      setSuppliers((prev) => [
        ...prev,
        { id: res.supplier.id, name: res.supplier.name, contact: null, phone: null, email: null, contractNumber: null, isActive: true },
      ]);
      setName("");
      setContact("");
      setPhone("");
      setEmail("");
      setContractNumber("");
    } finally {
      setIsSaving(false);
    }
  };

  const saveRow = async (s: Supplier) => {
    setIsSaving(true);
    try {
      const res = await updateWarehouseSupplier(
        s.id,
        { name: s.name, contact: s.contact, phone: s.phone, email: s.email, contractNumber: s.contractNumber, isActive: s.isActive },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocal = (id: number, patch: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="text-white font-semibold mb-4">Добавить поставщика</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Контакт</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Телефон</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Договор</label>
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={create}
              disabled={isSaving || name.trim().length < 2}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Создать
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm">Поставщики</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
            <tr>
              <th className="p-4 text-left font-medium">Название</th>
              <th className="p-4 text-left font-medium">Контакт</th>
              <th className="p-4 text-left font-medium">Телефон</th>
              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Договор</th>
              <th className="p-4 text-left font-medium">Активен</th>
              <th className="p-4 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sorted.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <input
                    value={s.name}
                    onChange={(e) => updateLocal(s.id, { name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </td>
                <td className="p-4">
                  <input
                    value={s.contact || ""}
                    onChange={(e) => updateLocal(s.id, { contact: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </td>
                <td className="p-4">
                  <input
                    value={s.phone || ""}
                    onChange={(e) => updateLocal(s.id, { phone: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </td>
                <td className="p-4">
                  <input
                    value={s.email || ""}
                    onChange={(e) => updateLocal(s.id, { email: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </td>
                <td className="p-4">
                  <input
                    value={s.contractNumber || ""}
                    onChange={(e) => updateLocal(s.id, { contractNumber: e.target.value || null })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </td>
                <td className="p-4">
                  <select
                    value={s.isActive ? "yes" : "no"}
                    onChange={(e) => updateLocal(s.id, { isActive: e.target.value === "yes" })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                  </select>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => saveRow(s)}
                    disabled={isSaving || s.name.trim().length < 2}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-sm font-medium disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Сохранить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 ? <div className="p-8 text-center text-gray-500">Нет поставщиков</div> : null}
      </div>
    </div>
  );
}

