import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { ensureAdminUser, signAdminToken } from '@/lib/admin';
import { getUserRepo } from '@/lib/repositories';
import {
  issueRefreshToken,
  applyFailedLoginAttempt,
  resetLoginAttempts,
  getLockoutRemainingMs,
  revokeRefreshToken,
  setSessionCookiePair,
  clearAllSessionCookies,
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
  if (adminRefresh) await revokeRefreshToken(adminRefresh);
  if (userRefresh) await revokeRefreshToken(userRefresh);

  const response = NextResponse.json({ message: 'Sesión cerrada' });
  clearAllSessionCookies(response.cookies);
  return response;
}

export async function POST(request: Request) {
  await ensureAdminUser();

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
    const user = await getUserRepo().findByEmail(email);

    if (user && getLockoutRemainingMs(user) > 0) {
      return NextResponse.json(
        { error: 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    if (!user?.isAdmin || !bcrypt.compareSync(password, user.password)) {
      if (user) await applyFailedLoginAttempt(user.id);
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    await resetLoginAttempts(user.id);

    const token = await signAdminToken(user.id);
    const refreshToken = await issueRefreshToken(user.id, 'admin');

    const cookieStore = await cookies();
    setSessionCookiePair(cookieStore, 'admin', token, refreshToken);

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
