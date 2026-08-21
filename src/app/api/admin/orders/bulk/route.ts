import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';
import { STATUS_FLOW } from '@/lib/admin-constants';
import type { OrderStatus } from '@/lib/models';

const validStatuses = STATUS_FLOW.filter((s) => s !== 'pending');

const bulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(validStatuses as [OrderStatus, ...OrderStatus[]]),
});

/**
 * Acción masiva sobre pedidos: cambia el estado de N pedidos a la vez.
 * Usa POST (no PATCH) para que Next.js lo trate como ruta estática y no
 * colisione con la dinámica /api/admin/orders/[id].
 */
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
    const parsed = bulkStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'IDs o estado inválido. Valores permitidos: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const { ids, status } = parsed.data;
    const orderRepo = getOrderRepo();
    let updated = 0;

    for (const id of ids) {
      const result = orderRepo.updateStatus(id, status);
      if (result) updated += 1;
    }

    return NextResponse.json({ updated, total: ids.length });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar pedidos' }, { status: 500 });
  }
}