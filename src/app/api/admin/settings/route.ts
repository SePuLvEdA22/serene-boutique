import { NextResponse } from 'next/server';
import { SettingsSchema } from '@/lib/models/settings';
import { getSettingsRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({ settings: getSettingsRepo().get() });
}

export async function PUT(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = SettingsSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de configuración inválidos' }, { status: 400 });
    }

    const settings = getSettingsRepo().update(parsed.data);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}