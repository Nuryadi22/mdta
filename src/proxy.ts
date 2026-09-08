import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    // If user is already authenticated and tries to access /login, redirect to home
    const session = request.cookies.get('mdta_session')?.value;
    if (session === 'admin-authenticated') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Check session cookie for protected routes
  const session = request.cookies.get('mdta_session')?.value;

  if (!session || session !== 'admin-authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and API routes
    '/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.png$).*)',
  ],
};
