import { describe, expect, it, vi } from 'vitest'

function mockNextHeaders({ cookieToken, origin, host }: { cookieToken: string | null; origin: string | null; host: string | null }) {
  vi.doMock('next/headers', () => {
    return {
      cookies: async () => ({
        get: (name: string) => (name === 'csrf_token' && cookieToken ? { value: cookieToken } : undefined),
      }),
      headers: async () =>
        new Headers({
          ...(origin ? { origin } : {}),
          ...(host ? { host } : {}),
        }),
    }
  })
}

describe('csrf', () => {
  it('accepts matching token and same-origin', async () => {
    mockNextHeaders({ cookieToken: 't', origin: 'https://example.com', host: 'example.com' })
    const { assertCsrfTokenValue } = await import('./csrf')
    const res = await assertCsrfTokenValue('t')
    expect(res.ok).toBe(true)
    vi.resetModules()
  })

  it('accepts when origin header is missing but host is present', async () => {
    mockNextHeaders({ cookieToken: 't', origin: null, host: 'example.com' })
    const { assertCsrfTokenValue } = await import('./csrf')
    const res = await assertCsrfTokenValue('t')
    expect(res.ok).toBe(true)
    vi.resetModules()
  })

  it('rejects on token mismatch', async () => {
    mockNextHeaders({ cookieToken: 't1', origin: 'https://example.com', host: 'example.com' })
    const { assertCsrfTokenValue } = await import('./csrf')
    const res = await assertCsrfTokenValue('t2')
    expect(res.ok).toBe(false)
    vi.resetModules()
  })

  it('rejects on origin mismatch', async () => {
    mockNextHeaders({ cookieToken: 't', origin: 'https://evil.com', host: 'example.com' })
    const { assertCsrfTokenValue } = await import('./csrf')
    const res = await assertCsrfTokenValue('t')
    expect(res.ok).toBe(false)
    vi.resetModules()
  })

  it('rejects when host header is missing', async () => {
    mockNextHeaders({ cookieToken: 't', origin: 'https://example.com', host: null })
    const { assertCsrfTokenValue } = await import('./csrf')
    const res = await assertCsrfTokenValue('t')
    expect(res.ok).toBe(false)
    vi.resetModules()
  })

  it('validates assertCsrf(FormData)', async () => {
    mockNextHeaders({ cookieToken: 't', origin: 'https://example.com', host: 'example.com' })
    const { assertCsrf } = await import('./csrf')
    const fd = new FormData()
    fd.set('csrf_token', 't')
    const res = await assertCsrf(fd)
    expect(res.ok).toBe(true)
    vi.resetModules()
  })
})
