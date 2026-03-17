import { describe, expect, it, vi } from 'vitest'

const auditCreate = vi.fn()

vi.mock('@/lib/prisma', () => {
  return {
    getPrisma: () => ({
      auditEvent: {
        create: auditCreate,
      },
    }),
  }
})

import { logAudit } from './audit'

describe('logAudit', () => {
  it('stringifies metadata', async () => {
    await logAudit({ actorUserId: 1, action: 'x', target: 't', metadata: { a: 1 } })
    expect(auditCreate).toHaveBeenCalledTimes(1)
    const arg = (auditCreate as any).mock.calls[0][0]
    expect(arg.data.metadata).toBe(JSON.stringify({ a: 1 }))
  })

  it('stores null metadata when absent', async () => {
    ;(auditCreate as any).mockClear()
    await logAudit({ actorUserId: 1, action: 'x', target: null, metadata: null })
    const arg = (auditCreate as any).mock.calls[0][0]
    expect(arg.data.metadata).toBeNull()
  })
})
