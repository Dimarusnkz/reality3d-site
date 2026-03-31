import { describe, expect, it, vi } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
  it('allows up to limit within window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const key = 'k'
    const limit = 3
    const windowMs = 1000

    expect((await rateLimit(key, limit, windowMs)).ok).toBe(true)
    expect((await rateLimit(key, limit, windowMs)).ok).toBe(true)
    expect((await rateLimit(key, limit, windowMs)).ok).toBe(true)
    const result = await rateLimit(key, limit, windowMs)
    expect(result.ok).toBe(false)

    vi.useRealTimers()
  })

  it('resets after window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))

    const key = 'reset'
    const limit = 1
    const windowMs = 1000

    expect((await rateLimit(key, limit, windowMs)).ok).toBe(true)
    expect((await rateLimit(key, limit, windowMs)).ok).toBe(false)

    vi.advanceTimersByTime(1001)
    expect((await rateLimit(key, limit, windowMs)).ok).toBe(true)

    vi.useRealTimers()
  })
})

