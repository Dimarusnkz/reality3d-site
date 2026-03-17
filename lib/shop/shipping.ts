export type ShippingMethod = 'pickup' | 'courier_spb' | 'russian_post';

export const PICKUP_ADDRESS =
  'г. Санкт-Петербург, пр. Современников, д. 1, к. 3 (вход с бокового подъезда)';

export const PICKUP_PHONE = '+7 (812) XXX-XX-XX';

export function calcShippingCostKopeks(method: ShippingMethod) {
  if (method === 'pickup') return 0;
  if (method === 'courier_spb') return 39900;
  return 29900;
}
