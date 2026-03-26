import { getClientIp, getUserAgent } from '@/lib/request'

export async function getLogMeta() {
  const ip = await getClientIp()
  const userAgent = await getUserAgent()
  
  let ipHash: string | null = null;
  if (ip) {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const ua = userAgent ? userAgent.slice(0, 500) : null
  return { ipHash, userAgent: ua }
}

