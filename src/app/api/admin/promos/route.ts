import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { PromoSchema } from '@/lib/models/promo';
import { getPromoRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

const createPromoSchema = PromoSchema.omit({ id: true, createdAt: true, usedCount: true });

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const promos = (await getPromoRepo().findAll()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ promos });
}

export async function POST(request: Request) {
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
    const parsed = createPromoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de promoción inválidos' }, { status: 400 });
    }

    const repo = getPromoRepo();
    const code = parsed.data.code.toUpperCase();

    if (await repo.findByCode(code)) {
      return NextResponse.json({ error: 'Ya existe una promoción con ese código' }, { status: 409 });
    }

    const promo = {
      ...parsed.data,
      code,
      id: `promo-${randomUUID()}`,
      createdAt: new Date().toISOString(),
      usedCount: 0,
    };

    await repo.create(promo);
    return NextResponse.json({ promo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear promoción' }, { status: 500 });
  }
}