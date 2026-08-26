import { NextResponse } from 'next/server';
import { getOrderRepo } from '@/lib/repositories';
import { getSessionUser } from '@/lib/session';

/**
 * GET /api/orders — órdenes del usuario autenticado (para "Mis órdenes" y el perfil).
 *
 * Nota de seguridad: este endpoint NO tiene POST. El flujo de compra pasa por
 * POST /api/mercadopago/create-preference (que valida precios contra el
 * catálogo) y el estado se confirma únicamente vía webhook de MercadoPago con
 * verificación de firma y de monto. Un POST que creara órdenes "confirmed"
 * sin pago sería un bypass de pago.
 */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ orders: [] });
    }

    const orders = (await getOrderRepo().findByUser(session.id)).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ orders });
  } catch (err) {
    // No enmascarar fallos como "sin órdenes": el cliente debe saber que hubo error.
    console.error('[API Orders] Error al listar órdenes:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
