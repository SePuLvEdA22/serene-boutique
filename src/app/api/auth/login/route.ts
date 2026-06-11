import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validation';
import { signUserToken } from '@/lib/auth';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit(rateLimitKey(request), {
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
    const user = db.users.get().find((u) => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = await signUserToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
