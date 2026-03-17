import crypto from 'crypto';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function makeTbankToken(payload: Record<string, unknown>, password: string) {
  const data: Record<string, unknown> = { ...payload, Password: password };
  delete data.Token;

  const keys = Object.keys(data).sort();
  let joined = '';
  for (const key of keys) {
    const value = data[key];
    if (value == null) continue;
    if (Array.isArray(value)) continue;
    if (isPlainObject(value)) continue;
    joined += String(value);
  }

  return crypto.createHash('sha256').update(joined, 'utf8').digest('hex');
}

export function verifyTbankToken(payload: Record<string, unknown>, password: string) {
  const token = typeof payload.Token === 'string' ? payload.Token : null;
  if (!token) return false;
  return makeTbankToken(payload, password) === token;
}

export type TbankInitResponse = {
  Success: boolean;
  ErrorCode: string;
  Status?: string;
  PaymentId?: string;
  PaymentURL?: string;
  Message?: string;
  Details?: string;
};

export async function tbankInit(payload: Record<string, unknown>) {
  const res = await fetch('https://securepay.tinkoff.ru/v2/Init', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as TbankInitResponse;
  return { ok: res.ok, json };
}
