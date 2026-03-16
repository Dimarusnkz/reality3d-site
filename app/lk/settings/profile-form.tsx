'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { updateProfile, updatePassword, ProfileState } from '@/app/actions/profile'
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CsrfTokenField } from '@/components/ui/csrf-token-field'

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
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <UserIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-white">Личные данные</h2>
        </div>
        
        <form action={profileAction} className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <CsrfTokenField />
           <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Имя</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  name="name"
                  defaultValue={user.name || ""} 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="Ваше имя"
                />
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="email" 
                  name="email"
                  defaultValue={user.email} 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  required
                  placeholder="email@example.com"
                />
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Телефон</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="tel" 
                  name="phone"
                  defaultValue={user.phone || ""} 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Адрес доставки</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  name="address"
                  defaultValue={user.address || ""} 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="Город, улица, дом, квартира"
                />
              </div>
           </div>
           
           <div className="md:col-span-2">
              {profileState.error && (
                <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4">
                   {profileState.error}
                </div>
              )}
              {profileState.success && profileState.message && (
                 <div className="text-green-500 text-sm bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4">
                   {profileState.message}
                 </div>
              )}
              
              <button 
                type="submit" 
                disabled={isProfilePending}
                className="neon-button px-8 py-2.5 flex items-center justify-center gap-2"
              >
                {isProfilePending ? 'Сохранение...' : 'Обновить профиль'}
              </button>
           </div>
        </form>
      </section>

      {/* Секция безопасности (Пароль) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-white">Безопасность</h2>
        </div>
        
        <form ref={passwordFormRef} action={passwordAction} className="max-w-md space-y-5">
           <CsrfTokenField />
           <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Текущий пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-12 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Новый пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  maxLength={25}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-12 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="Минимум 6 символов"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 ml-1">Максимум 25 символов</p>
           </div>

           <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Подтверждение пароля</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  maxLength={25}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-12 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                  placeholder="Повторите новый пароль"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
           </div>

           {passwordState.error && (
             <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                {passwordState.error}
             </div>
           )}
           {passwordState.success && passwordState.message && (
              <div className="text-green-500 text-sm bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                {passwordState.message}
              </div>
           )}
           
           <button 
             type="submit" 
             disabled={isPasswordPending}
             className="neon-button px-8 py-2.5 flex items-center justify-center gap-2"
           >
             {isPasswordPending ? 'Смена пароля...' : 'Изменить пароль'}
           </button>
        </form>
      </section>
    </div>
  )
}
