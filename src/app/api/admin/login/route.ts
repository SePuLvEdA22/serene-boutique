import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { ensureAdminUser, signAdminToken } from '@/lib/admin';
import { getUserRepo } from '@/lib/repositories';
import { ACCESS_TOKEN_TTL_SECONDS } from '@/lib/auth';
import {
  issueRefreshToken,
  applyFailedLoginAttempt,
  resetLoginAttempts,
  getLockoutRemainingMs,
  revokeRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from '@/lib/session';
import { adminLoginSchema } from '@/lib/validation';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

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

export async function DELETE(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  // Revocar refresh tokens en el servidor y limpiar todas las cookies de sesión.
  const cookieHeader = request.headers.get('cookie');
  const adminRefresh = cookieValue(cookieHeader, 'admin-refresh');
  const userRefresh = cookieValue(cookieHeader, 'auth-refresh');
  if (adminRefresh) revokeRefreshToken(adminRefresh);
  if (userRefresh) revokeRefreshToken(userRefresh);

  const response = NextResponse.json({ message: 'Sesión cerrada' });
  response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('admin-refresh', '', { maxAge: 0, path: '/' });
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('auth-refresh', '', { maxAge: 0, path: '/' });
  return response;
}

export async function POST(request: Request) {
  ensureAdminUser();

  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = getUserRepo().findByEmail(email);

    if (user && getLockoutRemainingMs(user) > 0) {
      return NextResponse.json(
        { error: 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    if (!user?.isAdmin || !bcrypt.compareSync(password, user.password)) {
      if (user) applyFailedLoginAttempt(user.id);
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    resetLoginAttempts(user.id);

    const token = await signAdminToken(user.id);
    const refreshToken = issueRefreshToken(user.id, 'admin');

    const cookieStore = await cookies();
    const secure = process.env.NODE_ENV === 'production';
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
    cookieStore.set('admin-refresh', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
    });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
