import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

function ensureCsrfCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get('csrf_token')?.value;
  if (existing) return;

  const token = crypto.randomUUID();
  response.cookies.set('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

function setSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/lk') || 
    request.nextUrl.pathname.startsWith('/admin');

  if (isProtectedRoute) {
    const session = request.cookies.get('session')?.value;
    const payload = await decrypt(session);

    if (!payload?.userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (request.method === 'GET') {
    ensureCsrfCookie(request, response);
  }
  setSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
