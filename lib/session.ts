import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPrisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { cache } from 'react';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production');
}

const key = new TextEncoder().encode(process.env.SESSION_SECRET || 'secret');

const cookie = {
  name: 'session',
  options: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' },
  duration: 24 * 60 * 60 * 1000,
};

type SessionJwtPayload = {
  userId: string;
  role: string;
  sessionId: string;
  expires: string;
};

export async function encrypt(payload: SessionJwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1day')
    .sign(key);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    const userId = typeof payload.userId === 'string' ? payload.userId : null;
    const role = typeof payload.role === 'string' ? payload.role : null;
    const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : null;
    const expires = typeof payload.expires === 'string' ? payload.expires : null;
    if (!userId || !role || !sessionId || !expires) return null;
    return { userId, role, sessionId, expires } as const;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: string) {
  const prisma = getPrisma();
  const expires = new Date(Date.now() + cookie.duration);
  const sessionDb = await prisma.session.create({
    data: {
      userId: parseInt(userId, 10),
      expiresAt: expires,
      ipHash: null,
      userAgent: null,
    },
    select: { id: true },
  });

  const session = await encrypt({ userId, role, sessionId: sessionDb.id, expires: expires.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set(cookie.name, session, { ...cookie.options, expires });

  await logAudit({ actorUserId: parseInt(userId, 10), action: 'auth.login', target: userId, metadata: { role } });
}

export async function verifySession() {
  const session = await getSession();

  if (!session || !session.userId || !session.sessionId) {
    redirect('/login');
  }

  return session;
}

export async function deleteSession() {
  const prisma = getPrisma();
  const cookieStore = await cookies();
  const session = cookieStore.get(cookie.name)?.value;
  const payload = await decrypt(session);
  if (payload?.sessionId) {
    await prisma.session.update({
      where: { id: payload.sessionId },
      data: { revokedAt: new Date() },
    });
  }
  if (payload?.userId) {
    await logAudit({ actorUserId: parseInt(payload.userId, 10), action: 'auth.logout', target: payload.userId });
  }
  cookieStore.delete(cookie.name);
}

/**
 * Get current session with caching for the duration of the request.
 */
export const getSession = cache(async () => {
  const prisma = getPrisma();
  const cookieStore = await cookies();
  const session = cookieStore.get(cookie.name)?.value;
  const payload = await decrypt(session);

  if (!payload?.userId || !payload?.sessionId) return null;

  const sessionDb = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { userId: true, expiresAt: true, revokedAt: true },
  });
  if (!sessionDb || sessionDb.revokedAt || sessionDb.expiresAt.getTime() <= Date.now()) return null;

  const user = await prisma.user.findUnique({ 
    where: { id: sessionDb.userId }, 
    select: { role: true } 
  });
  if (!user) return null;

  // Update lastUsedAt in the background (no await to avoid blocking)
  prisma.session.update({
    where: { id: payload.sessionId },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { userId: payload.userId as string, role: user.role, sessionId: payload.sessionId as string };
});
