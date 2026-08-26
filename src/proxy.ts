import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  inspectAdminTokenState,
  inspectUserTokenState,
  type TokenState,
} from '@/lib/auth';

/**
 * Gate de rutas (Next.js 16: sustituye a middleware.ts; corre sobre el
 * runtime Node por defecto, así que puede verificar JWT con jose+node:crypto).
 *
 * Aquí solo se valida CRIPTOGRAFÍA (firma/claims), nunca se toca la base de
 * datos ni se renuevan tokens: eso lo hacen requireAdmin()/getSessionUser()
 * dentro del request. Semántica:
 *
 * - Cookie ausente o con basura (firma inválida) → bloqueo/redirección aquí.
 * - Token vencido pero firmado → se deja pasar: la sesión se auto-renueva
 *   con el refresh token más adelante (evita desloguear a un admin real).
 */

/** Estado de sesión admin derivado de la cookie `admin-token`. */
async function adminSessionState(request: NextRequest): Promise<TokenState> {
  const cookie = request.cookies.get('admin-token')?.value;
  if (!cookie) return 'invalid';
  return inspectAdminTokenState(cookie);
}

/** Estado de sesión de cliente derivado de la cookie `auth-token`. */
async function userSessionState(request: NextRequest): Promise<TokenState> {
  const cookie = request.cookies.get('auth-token')?.value;
  if (!cookie) return 'invalid';
  return inspectUserTokenState(cookie);
}

function hasSession(state: TokenState): boolean {
  // Un access vencido sigue indicando una sesión que puede renovarse.
  return state === 'valid' || state === 'expired';
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminState = await adminSessionState(request);

  // Bloquear acceso del admin a la tienda — redirigir al panel
  if (
    hasSession(adminState) &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api')
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Redirigir de /admin/login a /admin si ya tiene sesión válida
  if (pathname === '/admin/login' && hasSession(adminState)) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Proteger rutas de administración (excepto login). Una cookie falsificada
  // (firma inválida) se bloquea aquí en lugar de llegar al render.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasSession(adminState)) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirigir usuarios logueados fuera de login/register
  if (pathname === '/iniciar-sesion' || pathname === '/registrarse') {
    const userState = await userSessionState(request);
    if (hasSession(userState)) {
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
