export type ShippingMethod = 'pickup' | 'courier_spb' | 'russian_post' | 'cdek' | 'yandex';

export const PICKUP_ADDRESS = 'г. Санкт-Петербург, пр. Современников, д. 1, к. 3';

export const PICKUP_PHONE = '+7 923-631-7850';

export function calcShippingCostKopeks(method: ShippingMethod) {
  if (method === 'pickup') return 0;
  if (method === 'courier_spb') return 39900;
  return 0;
}

export function getShippingMethodLabel(method: ShippingMethod | string) {
  if (method === 'pickup') return 'Самовывоз';
  if (method === 'courier_spb') return 'Курьер по СПб';
  if (method === 'russian_post') return 'Почта России';
  if (method === 'cdek') return 'СДЭК';
  if (method === 'yandex') return 'Яндекс Доставка';
  return String(method || '');
}
