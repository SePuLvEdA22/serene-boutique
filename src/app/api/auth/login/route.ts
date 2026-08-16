import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserRepo } from '@/lib/repositories';
import { loginSchema } from '@/lib/validation';
import { signUserToken, ACCESS_TOKEN_TTL_SECONDS } from '@/lib/auth';
import { signAdminToken } from '@/lib/admin';
import {
  issueRefreshToken,
  applyFailedLoginAttempt,
  resetLoginAttempts,
  getLockoutRemainingMs,
  REFRESH_TOKEN_TTL_MS,
} from '@/lib/session';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export async function POST(request: Request) {
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
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = getUserRepo().findByEmail(email);

    // Bloqueo temporal de cuenta tras N intentos fallidos (fuerza bruta).
    if (user && getLockoutRemainingMs(user) > 0) {
      return NextResponse.json(
        { error: 'Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.' },
        { status: 429 }
      );
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      if (user) applyFailedLoginAttempt(user.id);
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Login exitoso: reiniciar contador de intentos y emitir sesión.
    resetLoginAttempts(user.id);

    const token = await signUserToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    const refreshToken = issueRefreshToken(user.id, 'user');

    const response = NextResponse.json(
      {
        user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin === true },
        isAdmin: user.isAdmin === true,
      },
      { status: 200 }
    );

    const secure = process.env.NODE_ENV === 'production';
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
      path: '/',
    });
    response.cookies.set('auth-refresh', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
      path: '/',
    });

    // Si la cuenta es administrador, también abrir sesión de admin
    // para que el proxy redirija al panel y el acceso a /admin funcione.
    if (user.isAdmin) {
      const adminToken = await signAdminToken(user.id);
      const adminRefresh = issueRefreshToken(user.id, 'admin');
      response.cookies.set('admin-token', adminToken, {
        httpOnly: true,
        secure,
        sameSite: 'strict',
        maxAge: ACCESS_TOKEN_TTL_SECONDS,
        path: '/',
      });
      response.cookies.set('admin-refresh', adminRefresh, {
        httpOnly: true,
        secure,
        sameSite: 'strict',
        maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
        path: '/',
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}