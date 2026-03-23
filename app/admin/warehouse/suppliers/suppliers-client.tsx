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

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [contractNumber, setContractNumber] = useState("");

  const sorted = useMemo(() => suppliers.slice().sort((a, b) => a.name.localeCompare(b.name)), [suppliers]);

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

  const updateLocal = (id: number, patch: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white">
        <div className="text-white font-semibold mb-4">Добавить поставщика</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1 flex items-center gap-1">
              Наименование <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ООО 'Альфа-Пластик'"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1 flex items-center gap-1">
              ИНН <span className="text-red-500">*</span>
            </label>
            <input
              value={inn}
              onChange={(e) => setInn(e.target.value)}
              placeholder="7701234567"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">КПП</label>
            <input
              value={kpp}
              onChange={(e) => setKpp(e.target.value)}
              placeholder="770101001"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1 flex items-center gap-1">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1 flex items-center gap-1">
              Адрес <span className="text-red-500">*</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="г. Москва, ул. Ленина, д. 1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1 flex items-center gap-1">
              Контактное лицо <span className="text-red-500">*</span>
            </label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Иванов Иван Иванович"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@supplier.ru"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Реквизиты р/с</label>
            <input
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="р/с 40702810..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Договор</label>
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="№ 123 от 01.01.2024"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="md:col-span-4 flex justify-end pt-2">
            <button
              onClick={create}
              disabled={isSaving || name.trim().length < 2 || inn.trim().length < 10 || phone.trim().length < 5 || address.trim().length < 5 || contact.trim().length < 2}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
              Создать поставщика
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-gray-400 text-sm flex items-center justify-between">
          <span>Зарегистрированные поставщики</span>
          <span className="text-[10px] uppercase tracking-widest text-gray-600">Reality3D Warehouse</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-gray-400">
              <tr>
                <th className="p-4 text-left font-medium min-w-[200px]">Основная информация</th>
                <th className="p-4 text-left font-medium min-w-[200px]">Реквизиты и Договор</th>
                <th className="p-4 text-left font-medium min-w-[200px]">Контакты и Адрес</th>
                <th className="p-4 text-left font-medium">Статус</th>
                <th className="p-4 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sorted.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors align-top">
                  <td className="p-4 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase">Наименование</label>
                      <input
                        value={s.name}
                        onChange={(e) => updateLocal(s.id, { name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase">ИНН</label>
                        <input
                          value={s.inn || ""}
                          onChange={(e) => updateLocal(s.id, { inn: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase">КПП</label>
                        <input
                          value={s.kpp || ""}
                          onChange={(e) => updateLocal(s.id, { kpp: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px]"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase">Реквизиты счета</label>
                      <input
                        value={s.bankAccount || ""}
                        onChange={(e) => updateLocal(s.id, { bankAccount: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase">Договор</label>
                      <input
                        value={s.contractNumber || ""}
                        onChange={(e) => updateLocal(s.id, { contractNumber: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                      />
                    </div>
                  </td>
                  <td className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase">Контакт</label>
                        <input
                          value={s.contact || ""}
                          onChange={(e) => updateLocal(s.id, { contact: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase">Телефон</label>
                        <input
                          value={s.phone || ""}
                          onChange={(e) => updateLocal(s.id, { phone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white text-[11px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase">Адрес</label>
                      <input
                        value={s.address || ""}
                        onChange={(e) => updateLocal(s.id, { address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 uppercase">Статус</label>
                      <select
                        value={s.isActive ? "yes" : "no"}
                        onChange={(e) => updateLocal(s.id, { isActive: e.target.value === "yes" })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                      >
                        <option value="yes">Активен</option>
                        <option value="no">Неактивен</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => saveRow(s)}
                      disabled={isSaving || !s.name.trim() || !s.inn?.trim() || !s.phone?.trim() || !s.address?.trim() || !s.contact?.trim()}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 text-xs font-bold disabled:opacity-50 transition-all border border-slate-700"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                      Сохранить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 ? <div className="p-12 text-center text-gray-500 font-medium">Поставщики не найдены</div> : null}
      </div>
    </div>
  );
}

