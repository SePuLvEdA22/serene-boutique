import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, action, data } = body;

    console.log('[Mercado Pago Webhook]', { type, action, data });

    if (type === 'payment' && action === 'payment.created') {
      console.log('[Mercado Pago] Pago recibido:', data.id);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar webhook' },
      { status: 500 }
    );
  }
}
