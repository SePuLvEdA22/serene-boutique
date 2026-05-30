import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

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

    let userId: string | undefined;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;
      if (token) {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        userId = payload.id;
      }
    } catch {}

    const order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId,
      items,
      shipping,
      total,
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
    };

    db.orders.set([...db.orders.get(), order]);

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear la orden' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ orders: [] });
    }

    let userId: string;
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      userId = payload.id;
    } catch {
      return NextResponse.json({ orders: [] });
    }

    const orders = db.orders.get()
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}
