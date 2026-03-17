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

async function sendMaxPayload(payload: unknown) {
  const init: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: MAX_BOT_TOKEN || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  };

  try {
    const res1 = await fetchWithTimeout(`${MAX_API_URL}/messages`, init, MAX_TIMEOUT_MS);
    const body1 = await res1.text().catch(() => '');
    if (res1.ok) return { ok: true, status: res1.status, bodyText: body1 };
    if (res1.status === 429 || res1.status >= 500) {
      await sleep(300);
      const res2 = await fetchWithTimeout(`${MAX_API_URL}/messages`, init, MAX_TIMEOUT_MS);
      const body2 = await res2.text().catch(() => '');
      return { ok: res2.ok, status: res2.status, bodyText: body2 };
    }
    return { ok: false, status: res1.status, bodyText: body1 };
  } catch {
    await sleep(300);
    try {
      const res2 = await fetchWithTimeout(`${MAX_API_URL}/messages`, init, MAX_TIMEOUT_MS);
      const body2 = await res2.text().catch(() => '');
      return { ok: res2.ok, status: res2.status, bodyText: body2 };
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

export async function sendMaxMessage(message: string) {
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

    const ids = subscribers.map((sub: { chatId: string }) => {
      const asNumber = Number.parseInt(sub.chatId, 10);
      return Number.isFinite(asNumber) ? asNumber : sub.chatId;
    });

    let anyOk = false;
    for (let i = 0; i < ids.length; i += MAX_SEND_RPS) {
      const chunk = ids.slice(i, i + MAX_SEND_RPS);
      const chunkResults = await Promise.all(
        chunk.map(async (idToUse) => {
          const payload = { chat_id: idToUse, message: { text } };
          const r1 = await sendMaxPayload(payload);
          if (r1.ok) return true;

          const shouldRetry = r1.bodyText.includes('proto.payload') || r1.status === 400;
          if (!shouldRetry) return false;

          const r2 = await sendMaxPayload({ user_id: idToUse, message: { text } });
          return r2.ok;
        })
      );

      if (chunkResults.some(Boolean)) anyOk = true;

      if (i + MAX_SEND_RPS < ids.length) {
        await sleep(1000);
      }
    }

    return anyOk;
  } catch {
    return false;
  }
}
