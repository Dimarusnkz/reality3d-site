import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/lk') || 
    request.nextUrl.pathname.startsWith('/admin');

  if (isProtectedRoute) {
    const session = request.cookies.get('session')?.value;
    const payload = await decrypt(session);

    if (!payload?.userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'admin') {
       // Redirect non-admins to lk
       return NextResponse.redirect(new URL('/lk', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lk/:path*', '/admin/:path*'],
};
