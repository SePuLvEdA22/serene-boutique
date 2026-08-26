import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';
import { getContactRepo } from '@/lib/repositories';

export async function POST(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 3,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados mensajes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    await getContactRepo().create({
      id: `contact-${randomUUID()}`,
      ...parsed.data,
      createdAt: new Date().toISOString(),
      read: false,
    });

    return NextResponse.json(
      { message: 'Mensaje enviado correctamente' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar el mensaje' },
      { status: 500 }
    );
  }
}