'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { updateProfile, updatePassword, ProfileState } from '@/app/actions/profile'
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Phone, MapPin, ShieldCheck, Check, Loader2 } from 'lucide-react'
import { CsrfTokenField } from '@/components/ui/csrf-token-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const initialState: ProfileState = {
  message: '',
  error: '',
  success: false
}

type UserData = {
  name: string | null
  email: string
  phone: string | null
  address: string | null
  city: string | null
}

export function ProfileForm({ user }: { user: UserData }) {
  const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, initialState)
  const [passwordState, passwordAction, isPasswordPending] = useActionState(updatePassword, initialState)
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const passwordFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (passwordState.success) {
      passwordFormRef.current?.reset()
    }
  }, [passwordState.success])

  return (
    <div className="space-y-12">
      {/* Секция профиля */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Личные данные</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Основная информация и контакты</p>
          </div>
        </div>
        
        <form action={profileAction} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <CsrfTokenField />
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ваше имя</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  name="name"
                  defaultValue={user.name || ""} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-800" 
                  placeholder="Как к вам обращаться?"
                />
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email (Логин)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  name="email"
                  defaultValue={user.email} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-800" 
                  required
                  placeholder="example@mail.ru"
                />
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Телефон для связи</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="tel" 
                  name="phone"
                  defaultValue={user.phone || ""} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-800" 
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Город</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  name="city"
                  defaultValue={user.city || ""} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-800" 
                  placeholder="Например: Санкт-Петербург"
                  maxLength={100}
                />
              </div>
           </div>

           <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Адрес доставки</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  name="address"
                  defaultValue={user.address || ""} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-800" 
                  placeholder="Улица, дом, корпус, квартира..."
                />
              </div>
           </div>
           
           <div className="md:col-span-2 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                {profileState.error && (
                  <Badge variant="error" className="px-4 py-2 rounded-xl w-full md:w-auto text-xs font-bold">
                     {profileState.error}
                  </Badge>
                )}
                {profileState.success && profileState.message && (
                   <Badge variant="success" className="px-4 py-2 rounded-xl w-full md:w-auto text-xs font-bold flex items-center gap-2">
                     <Check className="w-3.5 h-3.5" />
                     {profileState.message}
                   </Badge>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={isProfilePending}
                className="h-12 px-10 font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20"
              >
                {isProfilePending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Сохранить изменения
              </Button>
           </div>
        </form>
      </section>

      {/* Секция безопасности (Пароль) */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Безопасность</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Управление паролем доступа</p>
          </div>
        </div>
        
        <form ref={passwordFormRef} action={passwordAction} className="max-w-2xl space-y-6 bg-slate-900/40 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <CsrfTokenField />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Текущий пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-white focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-800" 
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Новый пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    maxLength={25}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-white focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-800" 
                    placeholder="Минимум 6 знаков"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Повторите пароль</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    maxLength={25}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-white focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-800" 
                    placeholder="Еще раз новый пароль"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
             </div>
           </div>

           <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                {passwordState.error && (
                  <Badge variant="error" className="px-4 py-2 rounded-xl w-full md:w-auto text-xs font-bold">
                     {passwordState.error}
                  </Badge>
                )}
                {passwordState.success && passwordState.message && (
                   <Badge variant="success" className="px-4 py-2 rounded-xl w-full md:w-auto text-xs font-bold flex items-center gap-2">
                     <Check className="w-3.5 h-3.5" />
                     {passwordState.message}
                   </Badge>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={isPasswordPending}
                variant="secondary"
                className="h-12 px-10 font-black uppercase tracking-[0.2em] text-[10px] border-blue-500/20 text-blue-400 hover:bg-blue-500/10 shadow-xl shadow-blue-900/10"
              >
                {isPasswordPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Обновить пароль
              </Button>
           </div>
        </form>
      </section>
    </div>
  )
}
