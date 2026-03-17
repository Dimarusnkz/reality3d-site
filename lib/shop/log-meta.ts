import crypto from 'crypto'
import { getClientIp, getUserAgent } from '@/lib/request'

export async function getLogMeta() {
  const ip = await getClientIp()
  const userAgent = await getUserAgent()
  const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null
  const ua = userAgent ? userAgent.slice(0, 500) : null
  return { ipHash, userAgent: ua }
}

