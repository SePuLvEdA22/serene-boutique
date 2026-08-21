import { NextResponse } from 'next/server';
import { PromoSchema } from '@/lib/models/promo';
import { getPromoRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

const updatePromoSchema = PromoSchema.omit({ id: true, createdAt: true, usedCount: true }).partial();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePromoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de promoción inválidos' }, { status: 400 });
    }

    const repo = getPromoRepo();
    const existing = repo.findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }

    const data = { ...parsed.data };
    if (data.code) {
      const code = data.code.toUpperCase();
      const dup = repo.findByCode(code);
      if (dup && dup.id !== id) {
        return NextResponse.json({ error: 'Ya existe una promoción con ese código' }, { status: 409 });
      }
      data.code = code;
    }

    const updated = repo.update(id, data);
    return NextResponse.json({ promo: updated });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar promoción' }, { status: 500 });
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
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const deleted = getPromoRepo().delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Promoción no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar promoción' }, { status: 500 });
  }
}