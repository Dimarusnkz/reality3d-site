import { describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => {
  return {
    headers: () => new Headers({ 'x-real-ip': '127.0.0.1' }),
  }
})

vi.mock('@/lib/session', () => {
  return {
    getSession: vi.fn(async () => ({ userId: '1', role: 'admin' })),
  }
})

vi.mock('@/lib/rate-limit', () => {
  return {
    rateLimit: () => ({ ok: true, remaining: 1, resetAt: Date.now() + 1000 }),
  }
})

vi.mock('@/lib/csrf', () => {
  return {
    assertCsrfTokenValue: vi.fn(async () => ({ ok: true })),
  }
})

const setDbProviderMock = vi.fn()

vi.mock('@/lib/prisma', () => {
  return {
    getPrisma: () => ({ $connect: vi.fn(async () => {}) }),
    setDbProvider: (p: string) => setDbProviderMock(p),
    getDbProvider: () => 'postgres',
  }
})

vi.mock('@/lib/audit', () => {
  return {
    logAudit: vi.fn(async () => {}),
  }
})

import { getDatabasesHealth, switchDatabase } from './databases'
import { getSession } from '@/lib/session'

describe('switchDatabase', () => {
  it('switches provider when authorized and csrf ok', async () => {
    const res = await switchDatabase('sqlite', 'csrf')
    expect((res as any).success).toBe(true)
    expect(setDbProviderMock).toHaveBeenCalledWith('sqlite')
  })

  it('rejects invalid provider', async () => {
    const res = await switchDatabase('invalid' as any, 'csrf')
    expect((res as any).error).toBe('Invalid provider')
  })
})

describe('getDatabasesHealth', () => {
  it('returns unauthorized for non-admin', async () => {
    ;(getSession as any).mockResolvedValueOnce({ userId: '1', role: 'user' })
    const res = await getDatabasesHealth()
    expect((res as any).error).toBe('Unauthorized')
  })
})
