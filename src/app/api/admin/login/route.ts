import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { ensureAdminUser, signAdminToken } from '@/lib/admin';
import { adminLoginSchema } from '@/lib/validation';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export async function DELETE() {
  const response = NextResponse.json({ message: 'Sesión cerrada' });
  response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
  return response;
}

export async function POST(request: Request) {
  ensureAdminUser();

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
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = db.users.get().find(u => u.email === email && u.isAdmin);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await signAdminToken(user.id);

    const cookieStore = await cookies();
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
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
