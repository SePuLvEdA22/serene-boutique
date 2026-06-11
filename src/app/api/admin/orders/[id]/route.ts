import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { type StoreOrder } from '@/lib/db';

const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const updateStatusSchema = z.object({
  status: z.enum(validStatuses),
});

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
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Estado inválido. Valores permitidos: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const index = db.orders.get().findIndex(o => o.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const list = [...db.orders.get()];
    list[index] = {
      ...list[index],
      status: parsed.data.status,
    } as StoreOrder;
    db.orders.set(list);

    return NextResponse.json({ order: list[index] });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 });
  }
}
