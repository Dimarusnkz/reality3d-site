"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import Turnstile from "@/components/ui/turnstile";
import { cn } from "@/lib/utils";
import { login } from "@/actions/auth";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaError =
    state?.errors?.captcha?.[0] || (state?.errors as any)?.["cf-turnstile-response"]?.[0];
  const showCaptcha =
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === "true" &&
    !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20"></div>

      <div className="neon-card w-full max-w-md p-8 rounded-2xl relative z-10 mx-4">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-white mb-6 transition-colors">
           <ArrowLeft className="h-4 w-4 mr-1" />
           На главную
        </Link>
        
        <div className="mb-8 text-center">
           <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-primary text-glow">Reality</span>3D
           </h1>
           <p className="text-gray-400">Вход в личный кабинет</p>
           <p className="text-xs text-primary mt-2">Войдите в личный кабинет, чтобы отследить заказ</p>
        </div>

        <form className="space-y-4" action={formAction}>
           {state?.errors?.email && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
               <AlertCircle className="h-4 w-4" />
               {state.errors.email[0]}
             </div>
           )}
           {captchaError && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
               <AlertCircle className="h-4 w-4" />
               {captchaError}
             </div>
           )}
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input 
                name="email"
                type="email" 
                placeholder="client@example.com"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                required
                maxLength={30}
                pattern="[a-zA-Z0-9@._-]+"
              />
           </div>
           
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Пароль</label>
              <div className="relative">
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  required
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
           </div>

           {showCaptcha && (
             <>
               <input type="hidden" name="cf-turnstile-response" value={captchaToken} />
               <Turnstile onToken={setCaptchaToken} />
             </>
           )}

           <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="checkbox" className="rounded border-slate-800 bg-slate-900 text-primary focus:ring-primary" />
                 <span className="text-gray-400">Запомнить меня</span>
              </label>
              <a href="#" className="text-primary hover:underline">Забыли пароль?</a>
           </div>

           <button 
             type="submit"
             disabled={(showCaptcha && !captchaToken) || isPending}
             className={cn(
               "neon-button w-full flex items-center justify-center",
               ((showCaptcha && !captchaToken) || isPending) && "opacity-50 pointer-events-none grayscale"
             )}
           >
              {isPending ? "Вход..." : "Войти"}
           </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
           Нет аккаунта? <Link href="/register" className="text-white hover:underline">Регистрация</Link>
        </div>
      </div>
    </div>
  );
}
