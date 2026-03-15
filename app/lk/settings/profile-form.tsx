'use client'

import { useActionState } from 'react'
import { updateProfile, ProfileState } from '@/app/actions/profile'
import { useEffect } from 'react'

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
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)

  return (
    <form action={formAction} className="space-y-4">
       <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Имя</label>
          <input 
            type="text" 
            name="name"
            defaultValue={user.name || ""} 
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors" 
          />
       </div>
       <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <input 
            type="email" 
            name="email"
            defaultValue={user.email} 
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors" 
            required
          />
       </div>
       <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Телефон</label>
          <input 
            type="tel" 
            name="phone"
            defaultValue={user.phone || ""} 
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors" 
          />
       </div>
       <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Адрес доставки</label>
          <input 
            type="text" 
            name="address"
            defaultValue={user.address || ""} 
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors" 
            placeholder="Не указан" 
          />
       </div>
       
       {state.error && (
         <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            {state.error}
         </div>
       )}
       {state.success && state.message && (
          <div className="text-green-500 text-sm bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
            {state.message}
          </div>
       )}
       
       <button 
         type="submit" 
         disabled={isPending}
         className="neon-button w-full sm:w-auto px-6 py-2 flex items-center justify-center gap-2"
       >
         {isPending ? 'Сохранение...' : 'Сохранить'}
       </button>
    </form>
  )
}
