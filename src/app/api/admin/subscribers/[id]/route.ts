import { NextResponse } from 'next/server';
import { getSubscriberRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const deleted = getSubscriberRepo().delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar suscripción' }, { status: 500 });
  }
}