"use client";

import { useMemo, useState } from "react";
import { createWarehouseSupplier, updateWarehouseSupplier, deleteWarehouseSupplier } from "@/app/actions/warehouse-docs";
import { Edit2, Loader2, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  address: string | null;
  inn: string | null;
  kpp: string | null;
  bankAccount: string | null;
  contractNumber: string | null;
  isActive: boolean;
};

export function SuppliersClient({ initial }: { initial: Supplier[] }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [contractNumber, setContractNumber] = useState("");

  const filteredSuppliers = useMemo(() => {
    let list = suppliers.slice();
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(sup => 
        sup.name.toLowerCase().includes(s) ||
        (sup.inn && sup.inn.includes(s)) ||
        (sup.contact && sup.contact.toLowerCase().includes(s)) ||
        (sup.phone && sup.phone.includes(s))
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, searchTerm]);

  const create = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name,
        contact,
        phone,
        email: email || null,
        address,
        inn,
        kpp: kpp || null,
        bankAccount: bankAccount || null,
        contractNumber: contractNumber || null,
        isActive: true,
      };
      const res = await createWarehouseSupplier(payload, getCsrfToken());
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      setSuppliers((prev) => [
        ...prev,
        {
          id: res.supplier.id,
          name: res.supplier.name,
          contact,
          phone,
          email: email || null,
          address,
          inn,
          kpp: kpp || null,
          bankAccount: bankAccount || null,
          contractNumber: contractNumber || null,
          isActive: true,
        },
      ]);
      setName("");
      setContact("");
      setPhone("");
      setEmail("");
      setAddress("");
      setInn("");
      setKpp("");
      setBankAccount("");
      setContractNumber("");
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocal = (id: number, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const saveRow = async (s: Supplier) => {
    setIsSaving(true);
    try {
      const res = await updateWarehouseSupplier(
        s.id,
        {
          name: s.name,
          contact: s.contact,
          phone: s.phone,
          email: s.email,
          address: s.address,
          inn: s.inn,
          kpp: s.kpp,
          bankAccount: s.bankAccount,
          contractNumber: s.contractNumber,
          isActive: s.isActive,
        },
        getCsrfToken()
      );
      if (!res.ok) {
        alert(res.error || "Ошибка");
        return;
      }
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить поставщика?")) return;
    setIsSaving(true);
    try {
      const res = await deleteWarehouseSupplier(id, getCsrfToken());
      if (!res.ok) {
        alert(res.error);
        return;
      }
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Bar - Catalog Style */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Поиск по названию, ИНН или контакту..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Add Form - ProductForm Style */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          <h2 className="text-lg font-bold uppercase tracking-wider text-white">Новый поставщик</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Наименование *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ИНН *</label>
              <input value={inn} onChange={(e) => setInn(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">КПП</label>
              <input value={kpp} onChange={(e) => setKpp(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Контактное лицо *</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Телефон *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Юридический адрес *</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Банковский счет</label>
            <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Договор</label>
            <input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white" />
          </div>
          <div className="md:col-span-2 flex justify-end pt-4">
            <button
              onClick={create}
              disabled={isSaving || !name.trim() || !inn.trim() || !phone.trim()}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-10 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Plus className="w-4 h-4 mr-3" />}
              Зарегистрировать
            </button>
          </div>
        </div>
      </div>

      {/* List Table - ProductsTable Style */}
      <div className="neon-card rounded-2xl overflow-hidden border border-slate-800/50 shadow-2xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Зарегистрированные поставщики</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 border-b border-slate-800/50 text-gray-500 text-[9px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Компания</th>
                <th className="px-6 py-4 text-left">Реквизиты</th>
                <th className="px-6 py-4 text-left">Контакты</th>
                <th className="px-6 py-4 text-left">Статус</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredSuppliers.map((s) => {
                const isEditing = editingId === s.id;
                return (
                  <tr key={s.id} className="hover:bg-primary/[0.01] transition-colors group align-top">
                    <td className="px-6 py-5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input value={s.name} onChange={(e) => updateLocal(s.id, { name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs" />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={s.inn || ""} onChange={(e) => updateLocal(s.id, { inn: e.target.value })} placeholder="ИНН" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px] font-mono" />
                            <input value={s.kpp || ""} onChange={(e) => updateLocal(s.id, { kpp: e.target.value })} placeholder="КПП" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px] font-mono" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-white font-bold text-base group-hover:text-primary transition-colors">{s.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1">ИНН: {s.inn || "—"} | КПП: {s.kpp || "—"}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input value={s.bankAccount || ""} onChange={(e) => updateLocal(s.id, { bankAccount: e.target.value })} placeholder="Счет" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px] font-mono" />
                          <input value={s.contractNumber || ""} onChange={(e) => updateLocal(s.id, { contractNumber: e.target.value })} placeholder="Договор" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px]" />
                        </div>
                      ) : (
                        <div className="space-y-1 text-[10px] text-gray-400 font-mono">
                          <div>Р/С: {s.bankAccount || "—"}</div>
                          <div className="text-gray-500">Дог: {s.contractNumber || "—"}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input value={s.contact || ""} onChange={(e) => updateLocal(s.id, { contact: e.target.value })} placeholder="ФИО" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs" />
                          <input value={s.phone || ""} onChange={(e) => updateLocal(s.id, { phone: e.target.value })} placeholder="Тел" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs" />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-gray-300 font-medium">{s.contact || "—"}</div>
                          <div className="text-xs text-gray-500">{s.phone || "—"}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={s.isActive ? "success" : "warning"}>
                        {s.isActive ? "Активен" : "Отключен"}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveRow(s)} disabled={isSaving} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-slate-800 text-gray-400 hover:bg-slate-700">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingId(s.id)} className="p-2 rounded-lg bg-slate-900/50 text-blue-400 hover:bg-blue-500/10 border border-slate-800 transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => remove(s.id)} className="p-2 rounded-lg bg-red-500/5 text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
