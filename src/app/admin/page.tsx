'use client';

import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '@/lib/format-price';
import { STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS, statusLabel } from '@/lib/admin-constants';
import { useAdminFetch } from '@/lib/use-admin-fetch';
import { type Delta, type SalesPoint, type TopProduct } from '@/lib/admin-stats';

interface Stats {
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
  unreadContacts: number;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
    shipping: { name: string };
  }>;
}

const PAYMENT_LABELS: Record<string, string> = {
  card: 'Tarjeta',
  pse: 'PSE',
  sin_metodo: 'Sin método',
};

const ICON_MONEY = 'M2 10a2 2 0 012-2h16a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2v-9zm3-2V7a2 2 0 012-2h10a2 2 0 012 2v1M4 14h.01M7 14h.01M17 14h.01M5 17h.01M19 17h.01M9 14h6';
const ICON_CART = 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z';
const ICON_USERS = 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
const ICON_BOX = 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
const ICON_CHART = 'M3 3v18h18M8 17V9m4 8V5m4 12v-6';
const ICON_CARD = 'M3 10h18M7 15h2m4 0h4M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z';
const ICON_CATEGORY = 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z';
const ICON_TROPHY = 'M8 21h8m-4-4v4M6 3h12v4a6 6 0 01-12 0V3zM6 5H3v1a4 4 0 003 3.87M18 5h3v1a4 4 0 01-3 3.87';
const ICON_STOCK = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
const ICON_RECENT = 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';

export default function AdminDashboardPage() {
  const { data: stats, loading } = useAdminFetch<Stats>('/api/admin/stats');

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-xl bg-surface-container-high animate-pulse lg:col-span-2" />
          <div className="h-72 rounded-xl bg-surface-container-high animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const monthRevenue = stats.revenueMonth.current;
  const monthOrders = stats.salesSeries.reduce((sum, p) => sum + p.orders, 0);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">Dashboard</h1>
          <p className="mt-1 font-body text-sm text-on-surface-variant">Resumen general de la tienda</p>
        </div>
        {stats.attentionOrders > 0 && (
          <Link
            href="/admin/pedidos"
            className="rounded-full bg-error-container px-4 py-1.5 font-body text-sm font-medium text-on-error-container transition-transform hover:scale-[1.02]"
          >
            {stats.attentionOrders} pedido{stats.attentionOrders === 1 ? '' : 's'} por atender
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ingresos" value={formatPrice(stats.totalRevenue)} sub={formatDelta(stats.revenueToday)} tone={deltaTone(stats.revenueToday)} icon={ICON_MONEY} href="/admin/pedidos" />
        <KpiCard label="Pedidos" value={stats.totalOrders} sub={`${stats.ordersToday.current} hoy`} tone={deltaTone(stats.ordersToday)} icon={ICON_CART} href="/admin/pedidos" />
        <KpiCard label="Usuarios" value={stats.totalUsers} sub={`+${stats.newUsers30d} en 30 días`} icon={ICON_USERS} href="/admin/usuarios" />
        <KpiCard label="Productos" value={stats.totalProducts} icon={ICON_BOX} href="/admin/productos" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Tendencia de ingresos */}
        <div className="admin-card admin-card-pad lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-container/50 text-on-primary-container">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICON_CHART} />
                </svg>
              </span>
              <div>
                <h2 className="font-heading text-lg font-medium text-on-surface">Ingresos últimos 30 días</h2>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  {formatPrice(monthRevenue)} · {monthOrders} pedidos · ticket promedio {formatPrice(stats.avgOrderValue)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="chip text-[11px] bg-primary-container text-on-primary-container">Hoy {formatDelta(stats.revenueToday)}</span>
              <span className="chip text-[11px] bg-surface-container-high text-on-surface-variant">Semana {formatDelta(stats.revenueWeek)}</span>
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5).replace('-', '/')}
                  tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                  tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-between font-body text-xs text-on-surface-variant">
            <span>{stats.salesSeries[0]?.date.slice(5).replace('-', '/')}</span>
            <span>{stats.salesSeries[stats.salesSeries.length - 1]?.date.slice(5).replace('-', '/')}</span>
          </div>
        </div>

        {/* Pedidos por estado y métodos de pago */}
        <div className="flex flex-col gap-6">
          <div className="admin-card admin-card-pad">
            <CardHeader icon={ICON_CHART} title="Pedidos por estado" />
            {stats.totalOrders === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">No hay pedidos aún.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`chip text-[11px] ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || ''}`}>
                      {statusLabel(status)}
                    </span>
                    <span className="font-body text-sm font-medium text-on-surface">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card admin-card-pad">
            <CardHeader icon={ICON_CARD} title="Métodos de pago" />
            {stats.totalOrders === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">No hay pedidos aún.</p>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(stats.paymentMethods).map(([key, count]) => ({ key, count }))}>
                    <XAxis
                      dataKey="key"
                      tickFormatter={(v: string) => PAYMENT_LABELS[v] || v}
                      tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                    <Tooltip formatter={(v) => [String(v), 'Pedidos']} cursor={{ fill: 'var(--color-surface-container)' }} />
                    <Bar dataKey="count" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="admin-card admin-card-pad">
            <CardHeader icon={ICON_CATEGORY} title="Productos por categoría" />
            {stats.totalProducts === 0 ? (
              <p className="font-body text-sm text-on-surface-variant">No hay productos.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(stats.productsByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-body text-sm text-on-surface-variant">{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}</span>
                    <span className="font-body text-sm font-medium text-on-surface">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Top productos */}
        <div className="admin-card admin-card-pad">
          <CardHeader icon={ICON_TROPHY} title="Top productos" />
          {stats.topProducts.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant">Sin ventas aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.topProducts.map((p) => (
                <div key={p.productId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-on-surface">{p.name}</p>
                    <p className="font-body text-xs text-on-surface-variant">{p.quantity} vendidos</p>
                  </div>
                  <span className="shrink-0 font-body text-sm text-on-surface">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="admin-card admin-card-pad">
          <CardHeader icon={ICON_STOCK} title="Stock bajo" link="/admin/inventario" linkLabel="Ver inventario" />
          {stats.lowStock.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant">Todo en stock suficiente.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.lowStock.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/productos/${encodeURIComponent(p.id)}/editar`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-container"
                >
                  <p className="truncate font-body text-sm font-medium text-on-surface">{p.name}</p>
                  <span
                    className={`chip text-[11px] ${p.stock === 0 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos recientes */}
        <div className="admin-card admin-card-pad">
          <CardHeader icon={ICON_RECENT} title="Pedidos recientes" link="/admin/pedidos" linkLabel="Ver todos" />
          {stats.recentOrders.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant">No hay pedidos aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/pedidos/${encodeURIComponent(order.id)}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-container"
                >
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-on-surface">{order.shipping.name}</p>
                    <p className="font-body text-xs text-on-surface-variant">{order.id}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-body text-sm text-on-surface">{formatPrice(order.total)}</p>
                    <span className={`chip text-[10px] ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || ''}`}>
                      {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  href,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  href?: string;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const subColor =
    tone === 'good' ? 'text-green-600' : tone === 'bad' ? 'text-error' : 'text-on-surface-variant';
  const arrow = tone === 'good' ? '↑' : tone === 'bad' ? '↓' : '';
  const cleanSub = sub && arrow ? sub.replace(/^[+-]/, '') : sub;

  const content = (
    <div className="group admin-card h-full p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium">
      <div className="flex items-center justify-between">
        <p className="admin-label">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container/50 text-on-primary-container transition-colors group-hover:bg-primary-container">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={icon} />
          </svg>
        </span>
      </div>
      <p className="mt-3 font-heading text-2xl font-medium text-on-surface">{value}</p>
      {sub && (
        <p className={`mt-1.5 flex items-center gap-1 font-body text-xs font-medium ${subColor}`}>
          {arrow && <span aria-hidden="true">{arrow}</span>}
          {cleanSub}
        </p>
      )}
    </div>
  );

  if (href) return <Link href={href} className="block">{content}</Link>;
  return content;
}

function CardHeader({
  icon,
  title,
  link,
  linkLabel,
}: {
  icon: string;
  title: string;
  link?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container/50 text-on-primary-container">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={icon} />
          </svg>
        </span>
        <h2 className="font-heading text-base font-medium text-on-surface">{title}</h2>
      </div>
      {link && (
        <Link href={link} className="font-body text-xs font-medium text-primary hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function formatDelta(delta: Delta): string {
  const sign = delta.change > 0 ? '+' : '';
  return `${sign}${delta.change.toFixed(0)}%`;
}

function deltaTone(delta: Delta): 'good' | 'bad' | 'neutral' {
  if (delta.previous === 0 || delta.change === 0) return 'neutral';
  return delta.change > 0 ? 'good' : 'bad';
}

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SalesPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 shadow-soft">
      <p className="font-body text-xs text-on-surface-variant">{point.date}</p>
      <p className="font-body text-sm font-medium text-on-surface">{formatPrice(point.revenue)}</p>
      <p className="font-body text-xs text-on-surface-variant">{point.orders} pedidos</p>
    </div>
  );
}