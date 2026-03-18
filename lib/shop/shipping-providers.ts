export type ShippingCarrier = 'cdek' | 'yandex'

export type ShippingQuote = {
  ok: boolean
  carrier: ShippingCarrier
  currency: 'RUB'
  minKopeks: number
  maxKopeks: number
  etaDaysMin?: number
  etaDaysMax?: number
  error?: string
}

export async function quoteShipping(_input: {
  carrier: ShippingCarrier
  city: string
  address: string
  weightGrams?: number
  dimensionsMm?: { length: number; width: number; height: number }
}) {
  return { ok: false, carrier: _input.carrier, currency: 'RUB', minKopeks: 0, maxKopeks: 0, error: 'Not configured' } satisfies ShippingQuote
}
