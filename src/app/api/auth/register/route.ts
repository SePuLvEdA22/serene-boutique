import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserRepo } from '@/lib/repositories';
import { registerSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      const field = firstError?.path.join('.') || 'form';
      const messages: Record<string, string> = {
        name: 'El nombre debe tener al menos 2 caracteres',
        email: 'Email inválido',
        password: 'La contraseña debe tener al menos 6 caracteres',
        confirm: 'Las contraseñas no coinciden',
      };
      return NextResponse.json(
        { error: messages[field] || firstError?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    if (getUserRepo().findByEmail(email)) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    getUserRepo().create({ id, name, email, password: hashedPassword, isAdmin: false });

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