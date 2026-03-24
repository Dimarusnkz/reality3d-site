"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { CsrfTokenField } from "@/components/ui/csrf-token-field";
import { cn } from "@/lib/utils";
import { resetPassword } from "@/actions/auth";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const sp = useSearchParams();
  const token = sp.get("token") || "";

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
              Новый <span className="text-primary text-glow">пароль</span>
           </h1>
           <p className="text-gray-400">Установите новый пароль для вашей учетной записи</p>
        </div>

        {state?.success ? (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl flex items-start gap-3">
              <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">
                Пароль успешно изменен! Теперь вы можете войти с новым паролем.
              </p>
            </div>
            <Link href="/login" className="neon-button w-full flex items-center justify-center">
              Войти в аккаунт
            </Link>
          </div>
        ) : !token ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm">
              Ссылка недействительна. Пожалуйста, запросите сброс пароля снова.
            </p>
          </div>
        ) : (
          <form className="space-y-4" action={formAction}>
             <CsrfTokenField />
             <input type="hidden" name="token" value={token} />
             
             {(state?.errors as any)?.password && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                 <AlertCircle className="h-4 w-4" />
                 <ul className="list-disc list-inside">
                   {(state?.errors as any).password.map((err: string, i: number) => (
                     <li key={i}>{err}</li>
                   ))}
                 </ul>
               </div>
             )}

             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Новый пароль</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className={cn(
                      "w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-12",
                      (state?.errors as any)?.password && "border-red-500/50"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 ml-1">
                  Минимум 6 символов, заглавная буква и цифра
                </p>
             </div>

             <button 
               type="submit"
               disabled={isPending}
               className={cn(
                 "neon-button w-full flex items-center justify-center",
                 isPending && "opacity-50 pointer-events-none grayscale"
               )}
             >
                {isPending ? "Сохранение..." : "Сменить пароль"}
             </button>
          </form>
        )}
      </div>
    </div>
  );
}
