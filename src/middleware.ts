import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { extractSafeRole, isRouteAllowedForRole } from '@/lib/auth/roles';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtectedArea =
    pathname === '/student' ||
    pathname.startsWith('/student/') ||
    pathname === '/company' ||
    pathname.startsWith('/company/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/');

  if (isProtectedArea) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }

    const role = extractSafeRole(user);
    const isAllowed = isRouteAllowedForRole(pathname, role);

    if (!isAllowed) {
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      const redirectResponse = NextResponse.redirect(unauthorizedUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/media ending in extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
