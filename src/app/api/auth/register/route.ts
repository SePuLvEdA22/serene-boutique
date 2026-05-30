import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    if (db.users.get().find((u) => u.email === email)) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.users.get().push({ id, name, email, password: hashedPassword });

    console.log('[Auth] Usuario registrado:', email);

    return NextResponse.json(
      { user: { id, name, email } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al registrar' },
      { status: 500 }
    );
  }
}
