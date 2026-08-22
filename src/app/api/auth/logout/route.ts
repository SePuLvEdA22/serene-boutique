import { NextResponse } from 'next/server';
import { csrfBlocked } from '@/lib/csrf';
import {
  revokeRefreshToken,
  AUTH_REFRESH_COOKIE,
  ADMIN_REFRESH_COOKIE,
  clearAllSessionCookies,
} from '@/lib/session';

/** Lee una cookie del header `Cookie` sin depender del contexto de request. */
function cookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return undefined;
}

export async function POST(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  // Revocar refresh tokens en el servidor (la sesión muere aunque roben la
  // cookie). Se leen del header Cookie para no depender del request scope.
  const cookieHeader = request.headers.get('cookie');
  const userRefresh = cookieValue(cookieHeader, AUTH_REFRESH_COOKIE);
  const adminRefresh = cookieValue(cookieHeader, ADMIN_REFRESH_COOKIE);
  if (userRefresh) await revokeRefreshToken(userRefresh);
  if (adminRefresh) await revokeRefreshToken(adminRefresh);

  const response = NextResponse.json({ message: 'Sesión cerrada' });
  clearAllSessionCookies(response.cookies);
  return response;
}
