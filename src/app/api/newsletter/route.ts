import { NextResponse } from 'next/server';
import { newsletterSchema } from '@/lib/validation';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

const subscribers: string[] = [];

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit(rateLimitKey(request), {
      maxRequests: 3,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    if (subscribers.includes(email)) {
      return NextResponse.json(
        { message: 'Ya estás suscrito' },
        { status: 200 }
      );
    }

    subscribers.push(email);
    console.log('[Newsletter] Nuevo suscriptor:', email);

    return NextResponse.json(
      { message: 'Suscripción exitosa' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}
