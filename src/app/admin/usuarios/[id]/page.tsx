'use client';

import { use } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format-price';
import { STATUS_COLORS, statusLabel } from '@/lib/admin-constants';
import { useAdminFetch } from '@/lib/use-admin-fetch';
import StatusBadge from '@/components/admin/StatusBadge';
import PageHeader from '@/components/admin/PageHeader';

interface UserDetail {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string | null;
    consentAt: string | null;
  };
  orders: {
    total: number;
    totalSpent: number;
    ordersByStatus: Record<string, number>;
    recentOrders: Array<{
      id: string;
      total: number;
      status: string;
      createdAt: string;
    }>;
  };
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useAdminFetch<UserDetail>(
    '/api/admin/users/' + encodeURIComponent(id)
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-56 rounded bg-surface-container-high animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-surface-container py-16 text-center">
        <p className="font-body text-lg text-on-surface-variant">Usuario no encontrado.</p>
        <Link href="/admin/usuarios" className="mt-3 inline-block font-body text-sm text-primary hover:underline">
          Volver a usuarios
        </Link>
      </div>
    );
  }

  const { user, orders } = data;
  const avgOrder = orders.total > 0 ? orders.totalSpent / orders.total : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={user.name}
        subtitle={`${user.email} · Registro: ${formatDate(user.createdAt)} · Consentimiento (Ley 1581): ${formatDate(user.consentAt)}`}
        backHref="/admin/usuarios"
        backLabel="Volver a usuarios"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="admin-card p-5">
          <p className="admin-label">Pedidos</p>
          <p className="mt-2 font-heading text-2xl font-medium text-on-surface">{orders.total}</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-label">Total gastado</p>
          <p className="mt-2 font-heading text-2xl font-medium text-on-surface">{formatPrice(orders.totalSpent)}</p>
        </div>
        <div className="admin-card p-5">
          <p className="admin-label">Ticket promedio</p>
          <p className="mt-2 font-heading text-2xl font-medium text-on-surface">{formatPrice(avgOrder)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="admin-card admin-card-pad">
          <h2 className="mb-4 font-heading text-lg font-medium text-on-surface">Pedidos recientes</h2>
          {orders.recentOrders.length === 0 ? (
            <p className="font-body text-sm text-on-surface-variant">Este cliente aún no ha realizado pedidos.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/pedidos/${encodeURIComponent(order.id)}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-surface-container"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-on-surface">{order.id}</p>
                    <p className="font-body text-xs text-on-surface-variant">
                      {new Date(order.createdAt).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-on-surface">{formatPrice(order.total)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card admin-card-pad">
          <h2 className="mb-4 font-heading text-lg font-medium text-on-surface">Pedidos por estado</h2>
          {orders.total === 0 ? (
            <p className="font-body text-sm text-on-surface-variant">Sin datos.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(orders.ordersByStatus).map(([status, count]) => (
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
      </div>
    </div>
  );
}