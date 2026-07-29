'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/format-price';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
    shipping: { name: string };
  }>;
  ordersByStatus: Record<string, number>;
  productsByCategory: Record<string, number>;
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => {
        if (res.status === 401) { router.push('/admin/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setStats(data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 font-heading text-2xl font-medium text-on-surface md:text-3xl">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos" value={stats.totalProducts} href="/admin/productos" />
        <StatCard label="Pedidos" value={stats.totalOrders} href="/admin/pedidos" />
        <StatCard label="Usuarios" value={stats.totalUsers} href="/admin/usuarios" />
        <StatCard label="Ingresos" value={formatPrice(stats.totalRevenue)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface p-6">
          <h2 className="mb-4 font-heading text-lg font-medium text-on-surface">Pedidos recientes</h2>
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
                  <div>
                    <p className="font-body text-sm font-medium text-on-surface">{order.shipping.name}</p>
                    <p className="font-body text-xs text-on-surface-variant">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-on-surface">{formatPrice(order.total)}</p>
                    <span className={`chip text-[10px] ${order.status === 'cancelled' ? 'bg-error-container text-on-error-container' : ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Orders by status */}
        <div className="rounded-xl border border-outline-variant/50 bg-surface p-6">
          <h2 className="mb-4 font-heading text-lg font-medium text-on-surface">Pedidos por estado</h2>
          {stats.totalOrders === 0 ? (
            <p className="font-body text-sm text-on-surface-variant">No hay pedidos aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="font-body text-sm capitalize text-on-surface-variant">
                    {statusLabels[status] || status}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-container-high sm:w-48">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="min-w-[2ch] font-body text-sm font-medium text-on-surface">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <div className="rounded-xl border border-outline-variant/50 bg-surface p-5 transition-shadow hover:shadow-soft">
      <p className="font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 font-heading text-2xl font-medium text-on-surface">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
