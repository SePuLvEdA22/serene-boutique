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
 * - En modo producción, exige firma válida (x-signature) o verificación
 *   del pago contra la API real; las notificaciones no verificables se
 *   rechazan con 401 (no se acepta "modo test" en silencio).
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
  transaction_details?: {
    payment_method_reference_id?: string;
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
    console.log('[MercadoPago Webhook] Notificación recibida:', JSON.stringify(body));

    // MercadoPago envía diferentes tipos de notificaciones
    const { type, action, data } = body;

    // Webhook de prueba de MercadoPago
    if (type === 'test' || (body as Record<string, unknown>).test) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Notificación de pago por ID
    if (type === 'payment' && data?.id) {
      const paymentId = data.id as number;

      // Verificar firma si hay secret configurado (recomendado en producción)
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
        const order = getOrderRepo().findById(payment.external_reference);
        if (order) {
          getOrderRepo().updateStatus(payment.external_reference, orderStatus);
          console.log(
            `[MercadoPago Webhook] Orden ${payment.external_reference} actualizada a: ${orderStatus}`
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
