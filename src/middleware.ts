import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth/session';

const protectedRoutes = ['/admin'];
const authRoutes = ['/admin/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isProtectedRoute = protectedRoutes.some(route => path === route || path.startsWith(`${route}/`) && !path.startsWith('/admin/login'));
  const isAuthRoute = authRoutes.includes(path);

  const sessionCookie = request.cookies.get('session')?.value;
  const session = await decrypt(sessionCookie);

  // If trying to access a protected route without a valid session, redirect to login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // If trying to access login while already authenticated, redirect to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
