'use server'

import { headers, cookies } from 'next/headers'
import { assertCsrfTokenValue } from '@/lib/csrf'
import { logAudit } from '@/lib/audit'
import { getPrisma, getDbProvider } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'

type Provider = 'postgres' | 'sqlite' | 'mysql'

function providerList(): Provider[] {
  return ['postgres', 'sqlite', 'mysql']
}

async function getIpKey() {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  return fwd || h.get('x-real-ip') || 'unknown'
}

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return null
  }
  return session
}

async function pingProvider(provider: Provider) {
  const start = Date.now()
  try {
    const client =
      provider === 'sqlite'
        ? new (await import('../../generated/sqlite-client/index.js')).PrismaClient({
            datasources: { db: { url: process.env.DATABASE_URL_SQLITE } },
          })
        : provider === 'mysql'
          ? new (await import('../../generated/mysql-client/index.js')).PrismaClient({
              datasources: { db: { url: process.env.DATABASE_URL_MYSQL } },
            })
          : new (await import('@prisma/client')).PrismaClient({
              datasources: { db: { url: process.env.DATABASE_URL } },
            })

    await (client as any).$queryRawUnsafe('SELECT 1')
    await (client as any).$disconnect()
    return { ok: true as const, latencyMs: Date.now() - start }
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'unknown_error', latencyMs: Date.now() - start }
  }
}

export async function getDatabasesHealth() {
  const session = await requireAdmin()
  if (!session) return { error: 'Unauthorized' as const }

  const current = getDbProvider() as Provider
  const results = await Promise.all(
    providerList().map(async (p) => {
      const enabled =
        (p === 'postgres' && !!process.env.DATABASE_URL) ||
        (p === 'sqlite' && !!process.env.DATABASE_URL_SQLITE) ||
        (p === 'mysql' && !!process.env.DATABASE_URL_MYSQL)
      if (!enabled) return { provider: p, enabled: false, ok: false as const, error: 'not_configured' as const }
      const ping = await pingProvider(p)
      return { provider: p, enabled: true, ...ping }
    })
  )

  return { current, results }
}

export async function switchDatabase(provider: Provider, csrfToken: string) {
  const session = await requireAdmin()
  if (!session) return { error: 'Unauthorized' as const }

  const rl = rateLimit(`admin:db:switch:${await getIpKey()}`, 10, 60_000)
  if (!rl.ok) return { error: 'Too many requests' as const }

  const csrf = await assertCsrfTokenValue(csrfToken || null)
  if (!csrf.ok) return { error: csrf.error }

  if (!providerList().includes(provider)) return { error: 'Invalid provider' as const }
  
  const cookieStore = await cookies();
  cookieStore.set('db_provider', provider, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });

  await logAudit({
    actorUserId: parseInt(session.userId, 10),
    action: 'db.switch',
    target: provider,
    metadata: { provider },
  })

  return { success: true as const }
}
