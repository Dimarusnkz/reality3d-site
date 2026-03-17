'use server'

import { redirect } from 'next/navigation'
import { deleteSession } from '@/lib/session'
import { assertCsrf } from '@/lib/csrf'

export async function logout(formData: FormData) {
  const csrf = await assertCsrf(formData)
  if (!csrf.ok) {
    redirect('/login')
  }

  await deleteSession()
  redirect('/login')
}
