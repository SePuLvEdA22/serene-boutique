import { type Contact, type Order, type Product, type User } from '@/lib/models';
import { LOW_STOCK_THRESHOLD, ATTENTION_STATUSES, STATUS_FLOW } from '@/lib/admin-constants';

/**
 * Funciones puras de métricas del dashboard. Reciben `now` como parámetro para
 * ser deterministas y testeables; por defecto usan la fecha actual.
 */

export interface Delta {
  current: number;
  previous: number;
  /** Variación porcentual respecto al periodo anterior (0 si no hay base). */
  change: number;
}

export interface SalesPoint {
  date: string; // 'YYYY-MM-DD' (hora local)
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  revenueToday: Delta;
  revenueWeek: Delta;
  revenueMonth: Delta;
  ordersToday: Delta;
  newUsers30d: number;
  avgOrderValue: number;
  salesSeries: SalesPoint[];
  ordersByStatus: Record<string, number>;
  productsByCategory: Record<string, number>;
  paymentMethods: Record<string, number>;
  topProducts: TopProduct[];
  lowStock: Array<{ id: string; name: string; stock: number }>;
  attentionOrders: number;
  recentOrders: Order[];
  /** Mensajes del formulario de contacto sin leer. */
  unreadContacts: number;
}

/** Pedidos que cuentan para ingresos y métricas de venta (excluye cancelados). */
export const isCountableOrder = (o: Order): boolean => o.status !== 'cancelled';

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function makeDelta(current: number, previous: number): Delta {
  return {
    current,
    previous,
    change: previous > 0 ? ((current - previous) / previous) * 100 : 0,
  };
}

interface Totals {
  revenue: number;
  count: number;
}

function totalsInRange(orders: Order[], fromMs: number, toMs: number): Totals {
  let revenue = 0;
  let count = 0;
  for (const o of orders) {
    if (!isCountableOrder(o)) continue;
    const t = new Date(o.createdAt).getTime();
    if (t >= fromMs && t < toMs) {
      revenue += o.total;
      count += 1;
    }
  }
  return { revenue, count };
}

function buildSalesSeries(orders: Order[], now: Date, days: number): SalesPoint[] {
  const start = startOfDay(now);
  start.setDate(start.getDate() - (days - 1));
  const points: SalesPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const dayStart = new Date(start);
    dayStart.setDate(start.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const { revenue, count } = totalsInRange(orders, dayStart.getTime(), dayEnd.getTime());
    points.push({ date: dateKey(dayStart), revenue, orders: count });
  }
  return points;
}

function buildTopProducts(orders: Order[]): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const o of orders) {
    if (!isCountableOrder(o)) continue;
    for (const item of o.items) {
      const existing = map.get(item.productId);
      const revenue = item.price * item.quantity;
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += revenue;
      } else {
        map.set(item.productId, { productId: item.productId, name: item.name, quantity: item.quantity, revenue });
      }
    }
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
}

export function computeAdminStats(
  orders: Order[],
  products: Product[],
  users: User[],
  now: Date = new Date(),
  contacts: Contact[] = []
): AdminStats {
  const countableOrders = orders.filter(isCountableOrder);
  const totalRevenue = countableOrders.reduce((sum, o) => sum + o.total, 0);

  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(todayStart);
  monthStart.setDate(todayStart.getDate() - 29);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setDate(monthStart.getDate() - 30);

  const nowMs = now.getTime();
  const today = totalsInRange(orders, todayStart.getTime(), nowMs);
  const yesterday = totalsInRange(orders, yesterdayStart.getTime(), todayStart.getTime());
  const week = totalsInRange(orders, weekStart.getTime(), nowMs);
  const prevWeek = totalsInRange(orders, prevWeekStart.getTime(), weekStart.getTime());
  const month = totalsInRange(orders, monthStart.getTime(), nowMs);
  const prevMonth = totalsInRange(orders, prevMonthStart.getTime(), monthStart.getTime());

  const customerUsers = users.filter((u) => !u.isAdmin);
  const thirtyDaysAgo = nowMs - 30 * 24 * 60 * 60 * 1000;
  const newUsers30d = customerUsers.filter(
    (u) => u.createdAt && new Date(u.createdAt).getTime() >= thirtyDaysAgo
  ).length;

  const ordersByStatus: Record<string, number> = {};
  for (const status of STATUS_FLOW) {
    ordersByStatus[status] = orders.filter((o) => o.status === status).length;
  }

  const productsByCategory: Record<string, number> = {};
  for (const p of products) {
    productsByCategory[p.category] = (productsByCategory[p.category] || 0) + 1;
  }

  const paymentMethods: Record<string, number> = {};
  for (const o of orders) {
    const key = o.paymentMethod || 'sin_metodo';
    paymentMethods[key] = (paymentMethods[key] || 0) + 1;
  }

  const lowStock = products
    .filter((p) => p.stock !== undefined && p.stock < LOW_STOCK_THRESHOLD)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock as number }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8);

  const attentionOrders = orders.filter((o) => ATTENTION_STATUSES.includes(o.status)).length;

  const unreadContacts = contacts.filter((c) => !c.read).length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalUsers: customerUsers.length,
    totalRevenue,
    revenueToday: makeDelta(today.revenue, yesterday.revenue),
    revenueWeek: makeDelta(week.revenue, prevWeek.revenue),
    revenueMonth: makeDelta(month.revenue, prevMonth.revenue),
    ordersToday: makeDelta(today.count, yesterday.count),
    newUsers30d,
    avgOrderValue: countableOrders.length > 0 ? totalRevenue / countableOrders.length : 0,
    salesSeries: buildSalesSeries(orders, now, 30),
    ordersByStatus,
    productsByCategory,
    paymentMethods,
    topProducts: buildTopProducts(orders),
    lowStock,
    attentionOrders,
    recentOrders,
    unreadContacts,
  };
}