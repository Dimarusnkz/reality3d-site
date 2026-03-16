import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production');
}

const key = new TextEncoder().encode(process.env.SESSION_SECRET || 'secret');

const cookie = {
  name: 'session',
  options: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
  duration: 24 * 60 * 60 * 1000,
};

type SessionJwtPayload = {
  userId: string;
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
    const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : null;
    const expires = typeof payload.expires === 'string' ? payload.expires : null;
    if (!userId || !sessionId || !expires) return null;
    return { userId, sessionId, expires } as const;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: string) {
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

  const session = await encrypt({ userId, sessionId: sessionDb.id, expires: expires.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set(cookie.name, session, { ...cookie.options, expires });

  await logAudit({ actorUserId: parseInt(userId, 10), action: 'auth.login', target: userId, metadata: { role } });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(cookie.name)?.value;
  const payload = await decrypt(session);

  if (!payload?.userId || !payload?.sessionId) {
    redirect('/login');
  }

  const sessionDb = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { id: true, userId: true, expiresAt: true, revokedAt: true },
  });

  if (!sessionDb || sessionDb.revokedAt || sessionDb.expiresAt.getTime() <= Date.now()) {
    cookieStore.delete(cookie.name);
    redirect('/login');
  }

  await prisma.session.update({
    where: { id: sessionDb.id },
    data: { lastUsedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: sessionDb.userId }, select: { role: true } });
  if (!user) {
    cookieStore.delete(cookie.name);
    redirect('/login');
  }

  return { userId: payload.userId, role: user.role, sessionId: sessionDb.id };
}

export async function deleteSession() {
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

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(cookie.name)?.value;
  const payload = await decrypt(session);

  if (!payload?.userId || !payload?.sessionId) return null;

  const sessionDb = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { userId: true, expiresAt: true, revokedAt: true },
  });
  if (!sessionDb || sessionDb.revokedAt || sessionDb.expiresAt.getTime() <= Date.now()) return null;

  const user = await prisma.user.findUnique({ where: { id: sessionDb.userId }, select: { role: true } });
  if (!user) return null;

  return { userId: payload.userId as string, role: user.role, sessionId: payload.sessionId as string };
}
