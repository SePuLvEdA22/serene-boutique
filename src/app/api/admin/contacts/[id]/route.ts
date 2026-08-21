import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getContactRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

const markReadSchema = z.object({
  read: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valor de read inválido' }, { status: 400 });
    }

    const updated = getContactRepo().markRead(id, parsed.data.read);

    if (!updated) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ contact: updated });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar mensaje' }, { status: 500 });
  }
}

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
    const deleted = getContactRepo().delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar mensaje' }, { status: 500 });
  }
}