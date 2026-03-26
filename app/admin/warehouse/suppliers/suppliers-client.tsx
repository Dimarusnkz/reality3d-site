"use client";

import { useMemo, useState } from "react";
import { createWarehouseSupplier, updateWarehouseSupplier, deleteWarehouseSupplier } from "@/app/actions/warehouse-docs";
import { Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
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
        alert(res.error || "Ошибка");
        return;
      }
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } finally {
      setIsSaving(false);
    }
  };

  const updateLocal = (id: number, patch: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl shadow-black/20">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-lg font-bold uppercase tracking-tight">Добавить поставщика</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              Наименование <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ООО 'Альфа-Пластик'"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              ИНН <span className="text-red-500">*</span>
            </label>
            <input
              value={inn}
              onChange={(e) => setInn(e.target.value)}
              placeholder="7701234567"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">КПП</label>
            <input
              value={kpp}
              onChange={(e) => setKpp(e.target.value)}
              placeholder="770101001"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700 font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@supplier.ru"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              Контактное лицо <span className="text-red-500">*</span>
            </label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Иванов Иван Иванович"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              Адрес <span className="text-red-500">*</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="г. Москва, ул. Ленина, д. 1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Реквизиты р/с</label>
            <input
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="р/с 40702810..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Договор</label>
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="№ 123 от 01.01.2024"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="md:col-span-4 flex justify-end pt-4">
            <button
              onClick={create}
              disabled={isSaving || name.trim().length < 2 || inn.trim().length < 10 || phone.trim().length < 5 || address.trim().length < 5 || contact.trim().length < 2}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-10 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90 disabled:opacity-50 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Plus className="w-4 h-4 mr-3" />}
              Создать поставщика
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>Зарегистрированные поставщики</span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-600">Reality3D Warehouse</span>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
            <input
              type="text"
              placeholder="ПОИСК ПО НАЗВАНИЮ, ИНН ИЛИ КОНТАКТУ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white text-[9px] focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-gray-700 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-gray-500 text-[9px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-4 text-left font-medium min-w-[280px]">Основная информация</th>
                <th className="p-4 text-left font-medium min-w-[250px]">Реквизиты и Договор</th>
                <th className="p-4 text-left font-medium min-w-[250px]">Контакты и Адрес</th>
                <th className="p-4 text-left font-medium w-[120px]">Статус</th>
                <th className="p-4 text-right font-medium w-[150px]">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors align-top">
                  <td className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Наименование</label>
                      <input
                        value={s.name}
                        onChange={(e) => updateLocal(s.id, { name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[11px] focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">ИНН</label>
                        <input
                          value={s.inn || ""}
                          onChange={(e) => updateLocal(s.id, { inn: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px] font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">КПП</label>
                        <input
                          value={s.kpp || ""}
                          onChange={(e) => updateLocal(s.id, { kpp: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px] font-mono"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Банковский счет</label>
                      <input
                        value={s.bankAccount || ""}
                        onChange={(e) => updateLocal(s.id, { bankAccount: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px] font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Договор</label>
                      <input
                        value={s.contractNumber || ""}
                        onChange={(e) => updateLocal(s.id, { contractNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px]"
                      />
                    </div>
                  </td>
                  <td className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Контакт</label>
                        <input
                          value={s.contact || ""}
                          onChange={(e) => updateLocal(s.id, { contact: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Телефон</label>
                        <input
                          value={s.phone || ""}
                          onChange={(e) => updateLocal(s.id, { phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-[10px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Адрес</label>
                      <input
                        value={s.address || ""}
                        onChange={(e) => updateLocal(s.id, { address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px]"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Статус</label>
                      <select
                        value={s.isActive ? "yes" : "no"}
                        onChange={(e) => updateLocal(s.id, { isActive: e.target.value === "yes" })}
                        className={cn(
                          "w-full border rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none transition-all",
                          s.isActive 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}
                      >
                        <option value="yes">АКТИВЕН</option>
                        <option value="no">ОТКЛЮЧЕН</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => saveRow(s)}
                        disabled={isSaving || !s.name.trim() || !s.inn?.trim() || !s.phone?.trim() || !s.address?.trim() || !s.contact?.trim()}
                        className="w-full inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-[9px] font-black uppercase tracking-widest disabled:opacity-50 transition-all border border-slate-700 active:scale-[0.95]"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2 text-emerald-400" />}
                        Сохранить
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        disabled={isSaving}
                        className="w-full inline-flex h-9 items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-[0.95]"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSuppliers.length === 0 ? <div className="p-12 text-center text-gray-600 font-black uppercase tracking-[0.2em] text-[10px]">Поставщики не найдены</div> : null}
      </div>
    </div>
  );
}

