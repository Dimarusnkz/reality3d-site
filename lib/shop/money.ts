export function formatRub(kopeks: number) {
  const value = (kopeks || 0) / 100;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
}

export function toKopeks(value: number) {
  return Math.round((value || 0) * 100);
}

export function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}
