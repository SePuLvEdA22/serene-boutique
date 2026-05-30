import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { ensureAdminUser } from '@/lib/admin';

export async function DELETE() {
  const response = NextResponse.json({ message: 'Sesión cerrada' });
  response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
  return response;
}

export async function POST(request: Request) {
  ensureAdminUser();

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const user = db.users.get().find(u => u.email === email && u.isAdmin);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');

    const cookieStore = await cookies();
    cookieStore.set('admin-token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
