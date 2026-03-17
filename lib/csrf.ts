import { cookies, headers } from 'next/headers';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_FIELD_NAME = 'csrf_token';

function getOrigin(headersList: Headers) {
  const origin = headersList.get('origin');
  const host = headersList.get('host');
  if (!host) return { origin, host: null, ok: false };
  if (!origin) return { origin: null, host, ok: true };

  try {
    const url = new URL(origin);
    return { origin, host, ok: url.host === host };
  } catch {
    return { origin, host, ok: false };
  }
}

export async function assertCsrf(formData: FormData) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
  const tokenField = formData.get(CSRF_FIELD_NAME);
  const token = typeof tokenField === 'string' ? tokenField : null;

  const headersList = await headers();
  const origin = getOrigin(headersList);

  if (!origin.ok) {
    return { ok: false as const, error: 'Запрос отклонён' };
  }

  if (!tokenCookie || !token || tokenCookie !== token) {
    return { ok: false as const, error: 'Сессия формы истекла. Обнови страницу и повтори.' };
  }

  return { ok: true as const };
}

export async function assertCsrfTokenValue(token: string | null) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value || null;

  const headersList = await headers();
  const origin = getOrigin(headersList);

  if (!origin.ok) {
    return { ok: false as const, error: 'Запрос отклонён' };
  }

  if (!tokenCookie || !token || tokenCookie !== token) {
    return { ok: false as const, error: 'Сессия формы истекла. Обнови страницу и повтори.' };
  }

  return { ok: true as const };
}

