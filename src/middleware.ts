import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';

// Define protected routes and their required roles
const PROTECTED_ROUTES = [
  { path: '/admin', roles: ['BEHEERDER'] },
  // Add more granular checks here if needed
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Check if route is public
  if (path === '/login' || path.startsWith('/api/auth') || path.startsWith('/_next') || path.startsWith('/static')) {
    return NextResponse.next();
  }

  // 2. Verify Session
  const token = request.cookies.get('session')?.value;
  const session = token ? await verifySession(token) : null;

  // 3. Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. Role-Based Access Control
  const routeConfig = PROTECTED_ROUTES.find(route => path.startsWith(route.path));
  if (routeConfig) {
    const userRole = session.role as string;
    if (!routeConfig.roles.includes(userRole)) {
      // User does not have permission
      // You could redirect to a 403 page, or just dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
