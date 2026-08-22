import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';
import { db } from '@/lib/db';

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

    const contact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...parsed.data,
      createdAt: new Date().toISOString(),
      read: false,
    };

    db.contacts.set([...(await db.contacts.get()), contact]);
    console.log('[Contacto] Mensaje recibido:', contact.email);

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