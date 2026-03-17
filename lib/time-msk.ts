const MSK_OFFSET_MS = 3 * 60 * 60 * 1000

export function getMskDayStartUtc(day: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null
  return new Date(Date.UTC(y, mo, d, 0, 0, 0) - MSK_OFFSET_MS)
}

export function getMskDayKeyFromDate(date: Date) {
  const msk = new Date(date.getTime() + MSK_OFFSET_MS)
  const y = msk.getUTCFullYear()
  const mo = String(msk.getUTCMonth() + 1).padStart(2, '0')
  const d = String(msk.getUTCDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

export function getMskDayRangeUtc(day: string) {
  const start = getMskDayStartUtc(day)
  if (!start) return null
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

