import { headers } from 'next/headers';

export async function getClientIp() {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || headersList.get('x-real-ip') || '0.0.0.0';
}

export async function getUserAgent() {
  const headersList = await headers();
  return headersList.get('user-agent') || null;
}

