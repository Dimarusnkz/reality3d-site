import { getSession } from '@/lib/session';

export type AppRole = 'admin' | 'moderator' | 'user' | 'guest';

export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) return 'guest';
  if (role === 'admin') return 'admin';
  if (role === 'manager') return 'moderator';
  if (role === 'engineer' || role === 'warehouse' || role === 'delivery') return 'moderator';
  return 'user';
}

export function isAdminLike(role: string | null | undefined) {
  return normalizeRole(role) === 'admin';
}

export function isModeratorLike(role: string | null | undefined) {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'moderator';
}

export async function requireRole(allowed: AppRole[]) {
  const session = await getSession();
  const role = normalizeRole(session?.role);
  if (!allowed.includes(role)) {
    return null;
  }
  return { userId: session?.userId || null, role };
}

