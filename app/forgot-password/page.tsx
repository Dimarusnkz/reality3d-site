"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { CsrfTokenField } from "@/components/ui/csrf-token-field";
import { cn } from "@/lib/utils";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20"></div>

      <div className="neon-card w-full max-w-md p-8 rounded-2xl relative z-10 mx-4">
        <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-white mb-6 transition-colors">
           <ArrowLeft className="h-4 w-4 mr-1" />
           Назад ко входу
        </Link>
        
        <div className="mb-8 text-center">
           <h1 className="text-3xl font-bold text-white mb-2">
              Восстановление <span className="text-primary text-glow">пароля</span>
           </h1>
           <p className="text-gray-400">Введите ваш Email, чтобы получить ссылку для сброса пароля</p>
        </div>

        {state?.success ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
            <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm">
              Если аккаунт с таким адресом существует, мы отправили на него инструкции по сбросу пароля. Проверьте почту (и папку Спам).
            </p>
          </div>
        ) : (
          <form className="space-y-4" action={formAction}>
             <CsrfTokenField />
             
             {(state?.errors as any)?.email && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                 <AlertCircle className="h-4 w-4" />
                 {(state?.errors as any).email[0]}
               </div>
             )}

             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className={cn(
                    "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                    (state?.errors as any)?.email && "border-red-500/50"
                  )}
                  placeholder="example@mail.ru"
                />
             </div>

             <button 
               type="submit"
               disabled={isPending}
               className={cn(
                 "neon-button w-full flex items-center justify-center",
                 isPending && "opacity-50 pointer-events-none grayscale"
               )}
             >
                {isPending ? "Отправка..." : "Отправить ссылку"}
             </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
           Вспомнили пароль? <Link href="/login" className="text-white hover:underline">Войти</Link>
        </div>
      </div>
    </div>
  );
}
