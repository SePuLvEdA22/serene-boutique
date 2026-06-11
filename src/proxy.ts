import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get('admin-token')?.value;

  // Bloquear acceso del admin a la tienda — redirigir al panel
  if (adminToken && !pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Redirigir de /admin/login a /admin si ya tiene sesión
  if (pathname === '/admin/login') {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Proteger rutas de administración (excepto login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirigir usuarios logueados fuera de login/register
  if (pathname === '/iniciar-sesion' || pathname === '/registrarse') {
    const authToken = request.cookies.get('auth-token')?.value;
    if (authToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/iniciar-sesion',
    '/registrarse',
    '/((?!api|_next|images|favicon|sitemap|robots).*)',
  ],
};
