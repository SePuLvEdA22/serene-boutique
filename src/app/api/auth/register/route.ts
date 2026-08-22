import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserRepo } from '@/lib/repositories';
import { registerServerSchema } from '@/lib/validation';
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
    const parsed = registerServerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      const field = firstError?.path.join('.') || 'form';
      const messages: Record<string, string> = {
        name: 'El nombre debe tener al menos 2 caracteres',
        email: 'Email inválido',
        password: 'La contraseña debe tener al menos 8 caracteres',
        consent: 'Debes aceptar la política de privacidad',
      };
      return NextResponse.json(
        { error: messages[field] || firstError?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { name, email, password, consent } = parsed.data;

    if (await getUserRepo().findByEmail(email)) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hashedPassword = bcrypt.hashSync(password, 10);
    await getUserRepo().create({
      id,
      name,
      email,
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      // Ley 1581: registrar cuándo se dio el consentimiento explícito.
      consentAt: consent ? new Date().toISOString() : undefined,
    });

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