import { NextResponse } from 'next/server';
import { getOrderRepo } from '@/lib/repositories';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import type { Order } from '@/lib/models';

/**
 * Consulta pública de una orden por su ID.
 *
 * La usa la página de confirmación /orden después de que el cliente vuelve
 * de MercadoPago (back_urls) o desde "Mis órdenes".
 *
 * Seguridad:
 * - Los IDs de orden son aleatorios (ORD-<timestamp>-<aleatorio>), por lo que
 *   no son adivinables ni enumerables.
 * - NO devuelve datos personales ni sensibles: se proyecta solo un subconjunto
 *   seguro (id, items, total, estado, método y fecha). Se omiten el envío
 *   (nombre/email/teléfono/dirección) y la identificación del pagador
 *   (cédula/NIT).
 * - Aplica rate limit por IP para evitar escaneo.
 */

/** Campos que la página pública de confirmación necesita (sin datos personales). */
function toPublicOrder(order: Order) {
  return {
    id: order.id,
    items: order.items,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
  };
}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!id || !id.startsWith('ORD-')) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const order = await getOrderRepo().findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ order: toPublicOrder(order) });
  } catch {
    return NextResponse.json({ error: 'Error al consultar la orden' }, { status: 500 });
  }
}
