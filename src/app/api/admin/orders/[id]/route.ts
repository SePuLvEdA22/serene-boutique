import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';

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
  const order = getOrderRepo().findById(id);

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

    const updated = getOrderRepo().updateStatus(id, parsed.data.status);

    if (!updated) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 });
  }
}