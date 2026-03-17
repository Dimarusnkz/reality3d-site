import { describe, expect, it, vi } from 'vitest'

function mockHeaders(h: Record<string, string>) {
  vi.doMock('next/headers', () => {
    return {
      headers: async () => new Headers(h),
    }
  })
}

describe('request helpers', () => {
  it('extracts client ip from x-forwarded-for', async () => {
    mockHeaders({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8', 'user-agent': 'ua' })
    const { getClientIp } = await import('./request')
    expect(await getClientIp()).toBe('1.2.3.4')
    vi.resetModules()
  })

  it('falls back to x-real-ip', async () => {
    mockHeaders({ 'x-real-ip': '9.9.9.9' })
    const { getClientIp } = await import('./request')
    expect(await getClientIp()).toBe('9.9.9.9')
    vi.resetModules()
  })

  it('returns null user-agent when missing', async () => {
    mockHeaders({})
    const { getUserAgent } = await import('./request')
    expect(await getUserAgent()).toBeNull()
    vi.resetModules()
  })
})
