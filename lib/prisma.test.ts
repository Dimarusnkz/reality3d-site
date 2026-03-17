import { describe, expect, it } from 'vitest'
import { getDbProvider, getPrisma, setDbProvider } from './prisma'

describe('lib/prisma db provider', () => {
  it('defaults to postgres', () => {
    setDbProvider('postgres')
    expect(getDbProvider()).toBe('postgres')
  })

  it('switches provider and creates a new client after invalidation', () => {
    setDbProvider('postgres')
    const pg = getPrisma()

    setDbProvider('sqlite')
    expect(getDbProvider()).toBe('sqlite')
    const sqlite1 = getPrisma()
    expect(sqlite1).not.toBe(pg)

    const sqlite2 = getPrisma()
    expect(sqlite2).toBe(sqlite1)

    setDbProvider('sqlite')
    const sqlite3 = getPrisma()
    expect(sqlite3).not.toBe(sqlite1)
  })
})
