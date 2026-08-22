import { NextResponse } from 'next/server';
import { getOrderRepo, getUserRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const target = await getUserRepo().findById(id);

  if (!target || target.isAdmin) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const orders = (await getOrderRepo().findAll()).filter((o) => o.userId === id);

  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const ordersByStatus: Record<string, number> = {};
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return NextResponse.json({
    user: {
      id: target.id,
      name: target.name,
      email: target.email,
      createdAt: target.createdAt ?? null,
      consentAt: target.consentAt ?? null,
    },
    orders: {
      total: orders.length,
      totalSpent,
      ordersByStatus,
      recentOrders,
    },
  });
}