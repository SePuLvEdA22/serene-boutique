import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderRepo } from '@/lib/repositories';
import { buildPreference, type PaymentMethodType } from '@/lib/mercadopago';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

const mpAccessToken = process.env.MP_ACCESS_TOKEN;

const identificationSchema = z.object({
  type: z.enum(['CC', 'CE', 'NIT', 'Pasaporte']),
  number: z.string().min(4, 'El número de documento debe tener al menos 4 caracteres'),
});

const preferenceSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        quantity: z.number().int().positive(),
        unit_price: z.number().positive(),
      })
    )
    .min(1),
  paymentMethod: z.enum(['card', 'pse']),
  payer: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      identification: identificationSchema.optional(),
    })
    .optional(),
  shipping: z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      notes: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = preferenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de preferencia inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { items, paymentMethod, payer, shipping } = parsed.data;

    // Crear orden en estado "pending" con información de pago
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // La URL base para back_urls y notification_url: usar el origen real del
    // request (dominio desplegado) y, si no viene, derivarlo de la URL del request.
    const origin =
      request.headers.get('origin') || new URL(request.url).origin || 'https://switchandtech.com';

    // Construir preferencia usando la librería
    const preference = buildPreference({
      items: items.map((item) => ({
        id: item.id,
        name: item.title,
        price: item.unit_price,
        quantity: item.quantity,
      })),
      paymentMethod: paymentMethod as PaymentMethodType,
      orderId,
      payer: payer
        ? {
            name: payer.name,
            email: payer.email,
            identification: payer.identification,
          }
        : undefined,
      baseUrl: origin,
    });

    const order = {
      id: orderId,
      items: items.map((item) => ({
        productId: item.id,
        name: item.title,
        price: item.unit_price,
        quantity: item.quantity,
      })),
      shipping: shipping
        ? {
            name: shipping.name,
            email: shipping.email,
            phone: shipping.phone,
            address: shipping.address,
            city: shipping.city,
            state: shipping.state,
            zip: shipping.zip,
            notes: shipping.notes || '',
          }
        : {
            name: 'Pendiente',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zip: '',
          },
      total: items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
      paymentMethod,
      payerIdentification: payer?.identification,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    getOrderRepo().create(order);

    if (!mpAccessToken) {
      // Modo de prueba: devolver URL simulada
      return NextResponse.json(
        {
          testMode: true,
          message:
            'Modo de prueba — Configura MP_ACCESS_TOKEN en .env para activar pagos reales.',
          orderId,
          preference: {
            id: `TEST_${Date.now()}`,
            init_point: `${origin}/orden?status=success&id=${orderId}`,
            items: preference.items,
          },
        },
        { status: 200 }
      );
    }

    // Crear preferencia en MercadoPago
    const mpResponse = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preference),
      }
    );

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('[MercadoPago] Error al crear preferencia:', errorText);

      // Actualizar orden como cancelada
      getOrderRepo().updateStatus(orderId, 'cancelled');

      return NextResponse.json(
        { error: 'Error al crear la preferencia de pago' },
        { status: 502 }
      );
    }

    const data = await mpResponse.json();

    // Guardar el ID de la preferencia en la orden
    const updatedOrder = getOrderRepo().findById(orderId);
    if (updatedOrder) {
      getOrderRepo().updateStatus(orderId, 'pending');
    }

    return NextResponse.json(
      {
        orderId,
        preference: {
          id: data.id,
          init_point: data.init_point,
          sandbox_init_point: data.sandbox_init_point,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[MercadoPago] Error en create-preference:', err);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de pago' },
      { status: 500 }
    );
  }
}
