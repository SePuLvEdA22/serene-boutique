import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { type StoreOrder } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const order = db.orders.get().find(o => o.id === id);

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const index = db.orders.get().findIndex(o => o.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const list = [...db.orders.get()];
    list[index] = {
      ...list[index],
      status: body.status || list[index].status,
    } as StoreOrder;
    db.orders.set(list);

    return NextResponse.json({ order: list[index] });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 });
  }
}
