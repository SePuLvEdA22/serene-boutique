import { NextResponse } from 'next/server';
import { newsletterSchema } from '@/lib/validation';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';
import { getSubscriberRepo } from '@/lib/repositories';

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
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || 'Email inválido' },
        { status: 400 }
      );
    }

    const { email, consent } = parsed.data;
    const existing = await getSubscriberRepo().findByEmail(email);

    if (existing) {
      return NextResponse.json(
        { message: 'Ya estás suscrito' },
        { status: 200 }
      );
    }

    // Ley 1581: registrar el consentimiento explícito al newsletter.
    await getSubscriberRepo().create({
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      subscribedAt: new Date().toISOString(),
      consentAt: consent ? new Date().toISOString() : undefined,
    });
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