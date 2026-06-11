import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

const contacts: { name: string; email: string; subject: string; message: string }[] = [];

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit(rateLimitKey(request), {
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

    contacts.push(parsed.data);
    console.log('[Contacto] Mensaje recibido:', parsed.data.email);

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
