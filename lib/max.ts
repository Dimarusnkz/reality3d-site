import { getPrisma } from '@/lib/prisma';

const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN;

// Base URL for MAX Platform API
const MAX_API_URL = process.env.MAX_API_URL || 'https://platform-api.max.ru';

const MAX_TIMEOUT_MS = Number(process.env.MAX_TIMEOUT_MS || 8000);
const MAX_SEND_RPS = Number(process.env.MAX_SEND_RPS || 25);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtmlToText(input: string) {
  return input
    .replaceAll(/<\s*br\s*\/?>/gi, '\n')
    .replaceAll(/<\s*\/\s*p\s*>/gi, '\n')
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .trim();
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function sendMaxPayload(recipient: { chatId?: number; userId?: number }, body: unknown) {
  const url = new URL(`${MAX_API_URL}/messages`)
  if (typeof recipient.chatId === 'number') url.searchParams.set('chat_id', String(recipient.chatId))
  if (typeof recipient.userId === 'number') url.searchParams.set('user_id', String(recipient.userId))

  const init: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: MAX_BOT_TOKEN || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };

  const tryOnce = async () => {
    const res = await fetchWithTimeout(url.toString(), init, MAX_TIMEOUT_MS);
    const bodyText = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, bodyText };
  }

  try {
    const res1 = await tryOnce();
    if (res1.ok) return res1;
    if (res1.status === 429 || res1.status >= 500) {
      await sleep(300);
      return await tryOnce();
    }
    return res1;
  } catch {
    await sleep(300);
    try {
      return await tryOnce();
    } catch {
      return { ok: false, status: 0, bodyText: '' };
    }
  }
}

export async function verifyMaxToken() {
  if (!MAX_BOT_TOKEN) return false;
  
  try {
    const response = await fetchWithTimeout(`${MAX_API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': MAX_BOT_TOKEN,
        'Content-Type': 'application/json',
      },
    }, MAX_TIMEOUT_MS);
    
    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

export async function sendMaxMessage(
  message: string,
  options: {
    attachments?: any[]
    disable_link_preview?: boolean
    notify?: boolean
    format?: 'markdown' | 'html'
  } = {}
) {
  const prisma = getPrisma()
  if (!MAX_BOT_TOKEN) {
    return false;
  }

  try {
    const subscribers = await prisma.maxSubscriber.findMany();
    
    if (subscribers.length === 0) {
      return false;
    }

    const text = stripHtmlToText(message);
    if (!text) {
      return false;
    }

    const chatIds = subscribers
      .map((sub: { chatId: string }) => Number.parseInt(sub.chatId, 10))
      .filter((v: number) => Number.isFinite(v));

    let anyOk = false;
    for (let i = 0; i < chatIds.length; i += MAX_SEND_RPS) {
      const chunk = chatIds.slice(i, i + MAX_SEND_RPS);
      const chunkResults = await Promise.all(
        chunk.map(async (idToUse) => {
          const body: any = {
            text,
          }
          if (options.attachments) body.attachments = options.attachments
          if (typeof options.disable_link_preview === 'boolean') body.disable_link_preview = options.disable_link_preview
          if (typeof options.notify === 'boolean') body.notify = options.notify
          if (options.format) body.format = options.format

          const r1 = await sendMaxPayload({ chatId: idToUse }, body);
          if (r1.ok) return true;

          const shouldRetry = r1.bodyText.includes('proto.payload') || r1.status === 400;
          if (!shouldRetry) return false;

          const r2 = await sendMaxPayload({ userId: idToUse }, body);
          return r2.ok;
        })
      );

      if (chunkResults.some(Boolean)) anyOk = true;

      if (i + MAX_SEND_RPS < chatIds.length) {
        await sleep(1000);
      }
    }

    return anyOk;
  } catch {
    return false;
  }
}
