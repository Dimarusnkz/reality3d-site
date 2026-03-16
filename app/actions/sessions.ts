'use server'

import { prisma } from '@/lib/prisma';
import { decrypt, deleteSession, getSession } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logAudit } from '@/lib/audit';
import { assertCsrf } from '@/lib/csrf';

export async function revokeSession(prevState: unknown, formData: FormData) {
  const csrf = await assertCsrf(formData);
  if (!csrf.ok) {
    return { ok: false, error: csrf.error };
  }

  const sessionId = formData.get('sessionId');
  if (typeof sessionId !== 'string' || sessionId.length < 10) {
    return { ok: false, error: 'Некорректная сессия' };
  }

  const current = await getSession();
  if (!current?.userId) {
    redirect('/login');
  }

  const userId = parseInt(current.userId, 10);

  const sessionDb = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, revokedAt: true },
  });

  if (!sessionDb || sessionDb.userId !== userId) {
    return { ok: false, error: 'Сессия не найдена' };
  }

  if (!sessionDb.revokedAt) {
    await prisma.session.update({ where: { id: sessionDb.id }, data: { revokedAt: new Date() } });
  }

  await logAudit({ actorUserId: userId, action: 'auth.session.revoke', target: sessionId });

  const cookieStore = await cookies();
  const jwt = cookieStore.get('session')?.value;
  const payload = await decrypt(jwt);
  if (payload?.sessionId === sessionId) {
    await deleteSession();
    redirect('/login');
  }

  return { ok: true };
}

export async function revokeAllMySessions(formData: FormData) {
  const csrf = await assertCsrf(formData);
  if (!csrf.ok) {
    redirect('/login');
  }

  const current = await getSession();
  if (!current?.userId) {
    redirect('/login');
  }

  const userId = parseInt(current.userId, 10);

  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await logAudit({ actorUserId: userId, action: 'auth.session.revoke_all', target: current.userId });
  await deleteSession();
  redirect('/login');
}

