import { NextResponse } from 'next/server';
import { getContactRepo, getProductRepo, getOrderRepo, getUserRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { computeAdminStats } from '@/lib/admin-stats';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const allOrders = await getOrderRepo().findAll();
  const allProducts = await getProductRepo().findAll();
  const allUsers = await getUserRepo().findAll();
  const allContacts = await getContactRepo().findAll();

  const stats = computeAdminStats(allOrders, allProducts, allUsers, new Date(), allContacts);

  return NextResponse.json(stats);
}