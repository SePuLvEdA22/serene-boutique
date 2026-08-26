import { NextResponse } from 'next/server';
import { getOrderRepo } from '@/lib/repositories';
import { verifyWebhookSignature } from '@/lib/webhook-signature';
import { isTestMode } from '@/lib/mercadopago';
import type { OrderStatus } from '@/lib/models';

/**
 * Webhook de MercadoPago.
 *
 * Recibe notificaciones de eventos de pago (IPN) y actualiza
 * el estado de las órdenes correspondientes.
 *
 * Referencia: https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks
 *
 * Seguridad:
 * - NO aplica CSRF (MercadoPago es servidor-a-servidor y no envía Origin).
 * - En producción con credenciales reales, EXIGE MP_WEBHOOK_SECRET: sin él
 *   la ruta responde 503 (misconfiguración) en vez de procesar notificaciones
 *   sin verificar. Dev/test mantienen un comportamiento tolerante.
 * - Exige firma válida (x-signature) o verificación del pago contra la API
 *   real; las notificaciones no verificables se rechazan con 401 (no se
 *   acepta "modo test" en silencio).
 */

export const runtime = 'nodejs';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference?: string;
  payment_method_id?: string;
  /** Monto total pagado en COP. Se compara contra el total de la orden. */
  transaction_amount?: number;
  transaction_details?: {
    payment_method_reference_id?: string;
    total_paid_amount?: number;
  };
}

async function getPaymentInfo(paymentId: number): Promise<MercadoPagoPayment | null> {
  if (!MP_ACCESS_TOKEN) {
    // Modo test: simular respuesta
    return null;
  }

  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!res.ok) {
      console.error('[MercadoPago Webhook] Error al obtener pago:', await res.text());
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[MercadoPago Webhook] Error de conexión al obtener pago:', err);
    return null;
  }
}

function mapMpStatusToOrderStatus(mpStatus: string): OrderStatus | null {
  switch (mpStatus) {
    case 'approved':
      return 'confirmed';
    case 'pending':
    case 'in_process':
      return 'pending';
    case 'rejected':
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'cancelled';
    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Log mínimo sin PII: el body completo puede incluir datos del pagador
    // (email, identificación) y no debe registrarse en los logs.
    console.log('[MercadoPago Webhook] Notificación recibida:', {
      type: (body as Record<string, unknown>).type,
      action: (body as Record<string, unknown>).action,
      dataId: (body as { data?: { id?: unknown } }).data?.id,
    });

    // MercadoPago envía diferentes tipos de notificaciones
    const { type, action, data } = body;

    // Webhook de prueba de MercadoPago
    if (type === 'test' || (body as Record<string, unknown>).test) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Notificación de pago por ID
    if (type === 'payment' && data?.id) {
      const paymentId = data.id as number;

      // Fail-fast de configuración: en producción con credenciales reales,
      // procesar notificaciones sin verificar firma sería un bypass del
      // webhook (cualquiera podría POSTear notificaciones falsas). Igual que
      // JWT_SECRET, el secret es obligatorio: sin él se rechaza la petición.
      if (!MP_WEBHOOK_SECRET && process.env.NODE_ENV === 'production' && !isTestMode) {
        console.error(
          '[MercadoPago Webhook] MP_WEBHOOK_SECRET no está configurado en producción — ' +
            'notificación rechazada (configúralo antes de recibir pagos reales)'
        );
        return NextResponse.json({ error: 'Webhook mal configurado' }, { status: 503 });
      }

      // Verificar firma si hay secret configurado (obligatorio en producción)
      if (MP_WEBHOOK_SECRET) {
        const valid = verifyWebhookSignature({
          signatureHeader: request.headers.get('x-signature'),
          requestId: request.headers.get('x-request-id'),
          dataId: String(paymentId),
          secret: MP_WEBHOOK_SECRET,
        });

        if (!valid) {
          console.error('[MercadoPago Webhook] Firma inválida — notificación rechazada');
          return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
        }
      }

      // Obtener detalles del pago
      const payment = await getPaymentInfo(paymentId);

      if (!payment) {
        if (isTestMode) {
          // Sin credenciales reales de MP: aceptar con aviso explícito.
          console.warn('[MercadoPago Webhook] Modo test: notificación aceptada sin verificación');
          return NextResponse.json({ received: true }, { status: 200 });
        }
        if (MP_WEBHOOK_SECRET) {
          // Firma ya validada arriba; sin datos del pago suele faltar MP_ACCESS_TOKEN.
          // Se acepta para no provocar reintentos infinitos de MercadoPago.
          console.error(
            '[MercadoPago Webhook] Firma válida pero no se pudo obtener el pago (¿MP_ACCESS_TOKEN configurado?)'
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }
        console.error('[MercadoPago Webhook] No se pudo verificar el pago — rechazada');
        return NextResponse.json({ error: 'No se pudo verificar el pago' }, { status: 401 });
      }

      console.log('[MercadoPago Webhook] Pago:', {
        id: payment.id,
        status: payment.status,
        detail: payment.status_detail,
        external_ref: payment.external_reference,
      });

      // Buscar orden por external_reference o preference ID
      const orderStatus = mapMpStatusToOrderStatus(payment.status);

      if (orderStatus && payment.external_reference) {
        const order = await getOrderRepo().findById(payment.external_reference);
        if (order) {
          // Seguridad: verificar que el monto pagado coincida con el total de la
          // orden. Un pago por un monto distinto (p. ej. $1) no debe confirmar la
          // orden. Sin esta verificación, un atacante podría pagar cualquier monto
          // y la orden quedaría como pagada.
          const paid =
            payment.transaction_amount ?? payment.transaction_details?.total_paid_amount;

          if (paid === undefined || Math.abs(paid - order.total) > 0.01) {
            console.error(
              `[MercadoPago Webhook] Monto no coincide para orden ${order.id}: ` +
                `pagado=${paid}, esperado=${order.total} — estado NO actualizado`
            );
            return NextResponse.json(
              { error: 'El monto del pago no coincide con la orden' },
              { status: 409 }
            );
          }

          await getOrderRepo().update(order.id, {
            status: orderStatus,
            mpPaymentId: String(payment.id),
          });
          console.log(
            `[MercadoPago Webhook] Orden ${order.id} actualizada a: ${orderStatus} (pago ${payment.id})`
          );
        }
      }
    }

    // Notificación de preferencia creada/actualizada
    if (type === 'payment' && action) {
      console.log('[MercadoPago Webhook] Acción de pago:', action);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('[MercadoPago Webhook] Error:', err);
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    );
  }
}
