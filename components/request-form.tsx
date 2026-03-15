"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitRequest } from "@/app/actions/requests";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      disabled={pending}
      type="submit"
      className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? <Loader2 className="animate-spin h-5 w-5" /> : null}
      {pending ? "Отправка..." : "Получить консультацию"}
    </button>
  );
}

export default function RequestForm() {
  const [state, setState] = useState<{ success?: boolean; error?: string } | null>(null);
  
  // Validation state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only letters (Cyrillic/Latin) and spaces, max 20 chars
    if (val.length <= 20 && /^[a-zA-Zа-яА-ЯёЁ\s]*$/.test(val)) {
      setName(val);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only digits, max 12 chars
    if (val.length <= 12 && /^\d*$/.test(val)) {
      setPhone(val);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only Latin letters, digits, @, ., _, -, max 30 chars
    if (val.length <= 30 && /^[a-zA-Z0-9@._-]*$/.test(val)) {
      setEmail(val);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Max 200 chars
    if (val.length <= 200) {
      setDescription(val);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    // Client-side validation before sending (double check)
    // Email regex for basic structure
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setState({ error: "Введите корректный Email (например, ivan@mail.ru)" });
        return;
    }

    const result = await submitRequest(formData);
    setState(result);
    if (result.success) {
        setName("");
        setPhone("");
        setEmail("");
        setDescription("");
    }
  };

  if (state?.success) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Заявка отправлена!</h3>
        <p className="text-gray-400">
          Мы свяжемся с вами в ближайшее время для уточнения деталей.
        </p>
        <button 
          onClick={() => setState(null)}
          className="mt-6 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Отправить еще одну заявку
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10">
       <h3 className="text-2xl font-bold text-white mb-6">Оставить заявку</h3>
       
       {state?.error && (
         <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
           <AlertCircle className="w-4 h-4 shrink-0" />
           {state.error}
         </div>
       )}

       <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <input 
                  name="name"
                  required
                  type="text" 
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Имя" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                />
                <div className="text-[10px] text-gray-500 text-right mt-1">{name.length}/20</div>
             </div>
             <div>
                <input 
                  name="phone"
                  required
                  type="text" 
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Телефон (цифры)" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
                />
                <div className="text-[10px] text-gray-500 text-right mt-1">{phone.length}/12</div>
             </div>
          </div>
          <div>
            <input 
                name="email"
                required
                type="text" 
                value={email}
                onChange={handleEmailChange}
                placeholder="Email (только латиница)" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none focus:ring-1 focus:ring-primary/50 transition-all" 
            />
            <div className="text-[10px] text-gray-500 text-right mt-1">{email.length}/30</div>
          </div>
          <div>
            <textarea 
                name="description"
                required
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Описание задачи..." 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-primary outline-none focus:ring-1 focus:ring-primary/50 transition-all h-32 resize-none"
            ></textarea>
            <div className="text-[10px] text-gray-500 text-right mt-1">{description.length}/200</div>
          </div>
          
          <SubmitButton />
          
          <p className="text-xs text-center text-gray-500">
             Нажимая кнопку, вы соглашаетесь с политикой обработки данных.
          </p>
       </form>
    </div>
  );
}
