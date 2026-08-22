'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format-price';

interface OrderSummary {
  id: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders((data.orders || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  return (
    <section className="rounded-2xl border border-outline-variant/50 bg-surface p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-medium text-on-surface">
            Últimas órdenes
          </h2>
          <p className="mt-1 font-body text-sm text-on-surface-variant">
            Resumen de tus compras recientes.
          </p>
        </div>
        <Link
          href="/mis-ordenes"
          className="font-body text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Ver todas
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {ordersLoading ? (
          <>
            <div className="h-20 animate-pulse rounded-xl bg-surface-container-high" />
            <div className="h-20 animate-pulse rounded-xl bg-surface-container-high" />
          </>
        ) : orders.length === 0 ? (
          <div className="rounded-xl bg-surface-container p-6 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-outline" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="mt-2 font-body text-sm text-on-surface-variant">
              No tienes órdenes aún.
            </p>
            <Link href="/fundas" className="mt-3 inline-block font-body text-sm font-medium text-primary transition-colors hover:text-primary/80">
              Ver productos
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/orden?id=${order.id}`}
              className="flex items-start justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 transition-all hover:border-outline-variant hover:shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                  <span className="font-body text-xs text-on-surface-variant">
                    {new Date(order.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="mt-1.5 font-body text-sm font-medium text-on-surface truncate">{order.id}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {order.items.slice(0, 2).map((item, i) => (
                    <span key={i} className="rounded-md bg-surface-container px-2 py-0.5 font-body text-[11px] text-on-surface-variant">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
                  {order.items.length > 2 && (
                    <span className="rounded-md bg-surface-container px-2 py-0.5 font-body text-[11px] text-on-surface-variant">
                      +{order.items.length - 2} más
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-heading text-sm font-medium text-on-surface">{formatPrice(order.total)}</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto mt-1 text-outline" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
