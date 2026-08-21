import { describe, it, expect } from 'vitest';
import {
  computeAdminStats,
  isCountableOrder,
} from '@/lib/admin-stats';
import type { Order, Product, User } from '@/types';

function makeProduct(id: string, name: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    name,
    description: '',
    price: 0,
    images: [],
    category: 'fundas',
    featured: false,
    colors: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isCountableOrder', () => {
  it('excludes cancelled orders', () => {
    expect(isCountableOrder({ status: 'cancelled' } as Order)).toBe(false);
    expect(isCountableOrder({ status: 'delivered' } as Order)).toBe(true);
    expect(isCountableOrder({ status: 'pending' } as Order)).toBe(true);
  });
});

describe('computeAdminStats', () => {
  // Fecha fija determinista: 2025-06-15 12:00 (hora local).
  const now = new Date(2025, 5, 15, 12, 0, 0);
  const iso = (y: number, m: number, d: number, h = 9): string =>
    new Date(y, m, d, h, 0, 0).toISOString();

  const baseOrders: Order[] = [
    {
      id: 'o1',
      items: [{ productId: 'p1', name: 'A', price: 10, quantity: 2 }],
      shipping: {} as Order['shipping'],
      total: 100,
      status: 'confirmed',
      createdAt: iso(2025, 5, 15, 10),
    },
    {
      id: 'o2',
      items: [{ productId: 'p1', name: 'A', price: 10, quantity: 2 }],
      shipping: {} as Order['shipping'],
      total: 200,
      status: 'cancelled',
      createdAt: iso(2025, 5, 15, 9),
    },
    {
      id: 'o3',
      items: [{ productId: 'p2', name: 'B', price: 5, quantity: 1 }],
      shipping: {} as Order['shipping'],
      total: 50,
      status: 'delivered',
      createdAt: iso(2025, 5, 14, 15),
    },
    {
      id: 'o4',
      items: [{ productId: 'p1', name: 'A', price: 10, quantity: 2 }],
      shipping: {} as Order['shipping'],
      total: 400,
      status: 'pending',
      createdAt: iso(2025, 5, 10),
    },
    {
      id: 'o5',
      items: [{ productId: 'p2', name: 'B', price: 5, quantity: 1 }],
      shipping: {} as Order['shipping'],
      total: 1000,
      status: 'shipped',
      createdAt: iso(2025, 3, 20),
    },
  ];

  const baseProducts: Product[] = [
    makeProduct('p1', 'A', { price: 10, category: 'fundas' }),
    makeProduct('p2', 'B', { price: 5, category: 'cargadores' }),
  ];

  const baseUsers: User[] = [
    { id: 'u1', name: 'Nuevo', email: 'nuevo@test.co', password: 'x', isAdmin: false, createdAt: iso(2025, 5, 1) },
    { id: 'u2', name: 'Viejo', email: 'viejo@test.co', password: 'x', isAdmin: false, createdAt: iso(2025, 2, 1) },
    { id: 'admin', name: 'Admin', email: 'admin@test.co', password: 'x', isAdmin: true, createdAt: iso(2025, 0, 1) },
  ];

  const stats = computeAdminStats(baseOrders, baseProducts, baseUsers, now);

  it('totalRevenue excluye pedidos cancelados', () => {
    expect(stats.totalRevenue).toBe(1550);
  });

  it('totalUsers excluye admins', () => {
    expect(stats.totalUsers).toBe(2);
  });

  it('newUsers30d cuenta solo usuarios con createdAt reciente', () => {
    expect(stats.newUsers30d).toBe(1);
  });

  it('revenueToday compara hoy vs ayer con delta correcto', () => {
    expect(stats.revenueToday.current).toBe(100);
    expect(stats.revenueToday.previous).toBe(50);
    expect(stats.revenueToday.change).toBe(100);
  });

  it('ordersToday cuenta pedidos de hoy (no cancelados)', () => {
    expect(stats.ordersToday.current).toBe(1);
  });

  it('revenueMonth incluye los últimos 30 días y su delta', () => {
    expect(stats.revenueMonth.current).toBe(550); // 100 + 50 + 400
    expect(stats.revenueMonth.previous).toBe(1000);
  });

  it('avgOrderValue usa solo pedidos no cancelados', () => {
    expect(stats.avgOrderValue).toBe(1550 / 4);
  });

  it('salesSeries genera 30 puntos y agrega por día', () => {
    expect(stats.salesSeries.length).toBe(30);
    const last = stats.salesSeries[stats.salesSeries.length - 1];
    expect(last.date).toBe('2025-06-15');
    expect(last.revenue).toBe(100);
    expect(last.orders).toBe(1);
    const yesterday = stats.salesSeries[stats.salesSeries.length - 2];
    expect(yesterday.date).toBe('2025-06-14');
    expect(yesterday.revenue).toBe(50);
  });

  it('ordersByStatus incluye todos los estados (incl. pending)', () => {
    expect(stats.ordersByStatus.pending).toBe(1);
    expect(stats.ordersByStatus.cancelled).toBe(1);
    expect(Object.keys(stats.ordersByStatus)).toContain('pending');
  });

  it('attentionOrders cuenta pending + confirmed', () => {
    expect(stats.attentionOrders).toBe(2);
  });

  it('topProducts agrega cantidad y ordena por cantidad', () => {
    const top = stats.topProducts;
    expect(top[0].productId).toBe('p1');
    expect(top[0].quantity).toBe(4); // 2 (o1) + 2 (o4); o2 cancelado no cuenta
    expect(top[0].revenue).toBe(40);
    expect(top[1].productId).toBe('p2');
    expect(top[1].quantity).toBe(2);
  });

  it('lowStock filtra y ordena ascendente por stock', () => {
    const products: Product[] = [
      makeProduct('s1', 'Bajo', { stock: 3 }),
      makeProduct('s2', 'Alto', { stock: 12 }),
      makeProduct('s3', 'Agotado', { stock: 0 }),
    ];
    const res = computeAdminStats([], products, [], now);
    expect(res.lowStock.map((p) => p.id)).toEqual(['s3', 's1']);
  });

  it('paymentMethods agrupa por método', () => {
    const orders: Order[] = [
      { ...baseOrders[0], paymentMethod: 'card' },
      { ...baseOrders[2], paymentMethod: 'pse' },
      { ...baseOrders[4] },
    ];
    const res = computeAdminStats(orders, [], [], now);
    expect(res.paymentMethods).toEqual({ card: 1, pse: 1, sin_metodo: 1 });
  });

  it('recentOrders ordena desc y limita a 5', () => {
    const res = computeAdminStats(baseOrders, [], [], now);
    expect(res.recentOrders[0].id).toBe('o1');
    expect(res.recentOrders.map((o) => o.id)).toEqual(['o1', 'o2', 'o3', 'o4', 'o5']);
  });

  it('convierte a cero cuando no hay datos', () => {
    const empty = computeAdminStats([], [], [], now);
    expect(empty.totalRevenue).toBe(0);
    expect(empty.avgOrderValue).toBe(0);
    expect(empty.revenueToday.change).toBe(0);
    expect(empty.lowStock).toEqual([]);
    expect(empty.topProducts).toEqual([]);
  });
});