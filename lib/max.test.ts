import { describe, expect, it, vi } from 'vitest'

function mockFetchSequence(responses: Array<{ ok: boolean; status?: number; body?: string }>) {
  const fn = vi.fn()
  for (const r of responses) {
    fn.mockResolvedValueOnce({
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 500),
      text: vi.fn(async () => r.body ?? ''),
    })
  }
  return fn
}

describe('lib/max', () => {
  it('sends message successfully', async () => {
    vi.resetModules()
    process.env.MAX_BOT_TOKEN = 'token'
    process.env.MAX_SEND_RPS = '25'
    process.env.MAX_TIMEOUT_MS = '100'

    const fetchMock = mockFetchSequence([{ ok: true }])
    ;(globalThis as any).fetch = fetchMock

    vi.doMock('@/lib/prisma', () => {
      return {
        getPrisma: () => ({
          maxSubscriber: { findMany: vi.fn(async () => [{ chatId: '123' }]) },
        }),
      }
    })

    const { sendMaxMessage } = await import('./max')
    const ok = await sendMaxMessage('<b>hello</b>')
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const body = (fetchMock as any).mock.calls[0][1].body as string
    expect(body).toContain('hello')
    expect(body).not.toContain('<b>')
  })

  it('retries with user_id on 400/proto payload', async () => {
    vi.resetModules()
    process.env.MAX_BOT_TOKEN = 'token'
    process.env.MAX_SEND_RPS = '25'
    process.env.MAX_TIMEOUT_MS = '100'

    const fetchMock = mockFetchSequence([
      { ok: false, status: 400, body: 'proto.payload' },
      { ok: true, status: 200, body: '' },
    ])
    ;(globalThis as any).fetch = fetchMock

    vi.doMock('@/lib/prisma', () => {
      return {
        getPrisma: () => ({
          maxSubscriber: { findMany: vi.fn(async () => [{ chatId: '123' }]) },
        }),
      }
    })

    const { sendMaxMessage } = await import('./max')
    const ok = await sendMaxMessage('hello')
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('handles timeout/abort without throwing', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    process.env.MAX_BOT_TOKEN = 'token'
    process.env.MAX_SEND_RPS = '25'
    process.env.MAX_TIMEOUT_MS = '5'

    const fetchMock = vi.fn(async (_url: string, init?: any) => {
      return await new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => reject(new Error('AbortError')))
        }
      })
    })
    ;(globalThis as any).fetch = fetchMock

    vi.doMock('@/lib/prisma', () => {
      return {
        getPrisma: () => ({
          maxSubscriber: { findMany: vi.fn(async () => [{ chatId: '123' }]) },
        }),
      }
    })

    const { sendMaxMessage } = await import('./max')
    const p = sendMaxMessage('hello')
    await vi.runAllTimersAsync()
    const ok = await p
    expect(ok).toBe(false)
    vi.useRealTimers()
  })

  it('throttles by MAX_SEND_RPS in batches', async () => {
    vi.resetModules()
    vi.useFakeTimers()
    process.env.MAX_BOT_TOKEN = 'token'
    process.env.MAX_SEND_RPS = '2'
    process.env.MAX_TIMEOUT_MS = '100'

    const fetchMock = mockFetchSequence([{ ok: true }, { ok: true }, { ok: true }])
    ;(globalThis as any).fetch = fetchMock

    vi.doMock('@/lib/prisma', () => {
      return {
        getPrisma: () => ({
          maxSubscriber: {
            findMany: vi.fn(async () => [{ chatId: '1' }, { chatId: '2' }, { chatId: '3' }]),
          },
        }),
      }
    })

    const { sendMaxMessage } = await import('./max')
    const p = sendMaxMessage('hello')
    await Promise.resolve()
    await Promise.resolve()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1000)
    await p

    expect(fetchMock).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })
})
