export type GuestCartLine = { productId: number; quantity: number }

const KEY = 'guest_cart_v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function guestCartRead(): GuestCartLine[] {
  if (!canUseStorage()) return []
  const raw = window.localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((x) => ({ productId: Number((x as any)?.productId), quantity: Number((x as any)?.quantity) }))
      .filter((x) => Number.isFinite(x.productId) && x.productId > 0 && Number.isFinite(x.quantity) && x.quantity > 0)
      .map((x) => ({ productId: Math.trunc(x.productId), quantity: Math.trunc(Math.min(99, x.quantity)) }))
  } catch {
    return []
  }
}

export function guestCartWrite(lines: GuestCartLine[]) {
  if (!canUseStorage()) return
  const normalized = lines
    .filter((x) => Number.isFinite(x.productId) && x.productId > 0 && Number.isFinite(x.quantity) && x.quantity > 0)
    .map((x) => ({ productId: Math.trunc(x.productId), quantity: Math.trunc(Math.min(99, x.quantity)) }))
  window.localStorage.setItem(KEY, JSON.stringify(normalized))
}

export function guestCartClear() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(KEY)
}

export function guestCartCount() {
  return guestCartRead().reduce((s, l) => s + l.quantity, 0)
}

export function guestCartAdd(productId: number, quantity: number) {
  const pid = Math.trunc(productId)
  const qty = Math.trunc(quantity)
  if (!Number.isFinite(pid) || pid <= 0) return
  if (!Number.isFinite(qty) || qty <= 0) return
  const lines = guestCartRead()
  const idx = lines.findIndex((l) => l.productId === pid)
  if (idx === -1) lines.push({ productId: pid, quantity: Math.min(99, qty) })
  else lines[idx] = { productId: pid, quantity: Math.min(99, lines[idx].quantity + qty) }
  guestCartWrite(lines)
}

export function guestCartSet(productId: number, quantity: number) {
  const pid = Math.trunc(productId)
  const qty = Math.trunc(quantity)
  if (!Number.isFinite(pid) || pid <= 0) return
  const lines = guestCartRead()
  const next = lines
    .map((l) => (l.productId === pid ? { ...l, quantity: qty } : l))
    .filter((l) => l.quantity > 0)
  guestCartWrite(next)
}

