import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUserEdge } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // API routes that don't require authentication
  const publicApiRoutes = ['/api/auth/login', '/api/auth/register'];
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));

  // If it's a public route or API route, allow access
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // For all other routes, check authentication
  try {
    const user = await getCurrentUserEdge();

    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware authentication error:', error);
    // On error, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
