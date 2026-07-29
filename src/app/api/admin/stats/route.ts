import { NextResponse } from 'next/server';
import { getProductRepo, getOrderRepo, getUserRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const allOrders = getOrderRepo().findAll();
  const allProducts = getProductRepo().findAll();
  const allUsers = getUserRepo().findAll();

  const totalProducts = allProducts.length;
  const totalOrders = allOrders.length;
  const totalUsers = allUsers.filter(u => !u.isAdmin).length;
  const totalRevenue = allOrders.reduce((sum: number, o) => sum + (o.total || 0), 0);
  const recentOrders = [...allOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const ordersByStatus = {
    confirmed: allOrders.filter(o => o.status === 'confirmed').length,
    processing: allOrders.filter(o => o.status === 'processing').length,
    shipped: allOrders.filter(o => o.status === 'shipped').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
  };
  const productsByCategory = {
    fundas: allProducts.filter(p => p.category === 'fundas').length,
    cargadores: allProducts.filter(p => p.category === 'cargadores').length,
    termos: allProducts.filter(p => p.category === 'termos').length,
    personalizados: allProducts.filter(p => p.category === 'personalizados').length,
  };

  return NextResponse.json({
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue,
    recentOrders,
    ordersByStatus,
    productsByCategory,
  });
}