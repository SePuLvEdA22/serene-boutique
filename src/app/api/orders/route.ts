import { NextResponse } from 'next/server';

const orders: Record<string, unknown>[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shipping, total } = body;

    if (!items?.length || !shipping || !total) {
      return NextResponse.json(
        { error: 'Datos de orden incompletos' },
        { status: 400 }
      );
    }

    const order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      items,
      shipping,
      total,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    orders.push(order);
    console.log('[Orden] Nueva orden creada:', order.id);

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear la orden' },
      { status: 500 }
    );
  }
}
