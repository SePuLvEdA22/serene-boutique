import { NextResponse } from 'next/server';
import { z } from 'zod';

const mpAccessToken = process.env.MP_ACCESS_TOKEN;

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
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = preferenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de preferencia inválidos' },
        { status: 400 }
      );
    }

    if (!mpAccessToken) {
      return NextResponse.json(
        {
          testMode: true,
          message:
            'Modo de prueba — Configura MP_ACCESS_TOKEN en .env para activar pagos reales.',
          preference: {
            id: `TEST_${Date.now()}`,
            items: parsed.data.items,
          },
        },
        { status: 200 }
      );
    }

    const preference = {
      items: parsed.data.items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: 'MXN' as const,
      })),
      back_urls: {
        success: `${request.headers.get('origin')}/orden`,
        failure: `${request.headers.get('origin')}/carrito`,
        pending: `${request.headers.get('origin')}/orden`,
      },
      auto_return: 'approved' as const,
      statement_descriptor: 'SWITCH&TECH',
    };

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
      console.error('[Mercado Pago] Error creating preference:', errorText);
      return NextResponse.json(
        { error: 'Error al crear la preferencia de pago' },
        { status: 502 }
      );
    }

    const data = await mpResponse.json();
    return NextResponse.json({ preference: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de pago' },
      { status: 500 }
    );
  }
}
