'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/products';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
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
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function MisOrdenesPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container-store py-12 animate-fade-in">
        <h1 className="font-heading text-3xl font-medium text-on-surface">Mis órdenes</h1>
        <div className="mt-8 flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-store py-12 animate-fade-in">
        <div className="mx-auto max-w-lg rounded-2xl bg-surface-container p-8 text-center">
          <h1 className="font-heading text-2xl font-medium text-on-surface">Inicia sesión</h1>
          <p className="mt-2 font-body text-base text-on-surface-variant">
            Necesitas iniciar sesión para ver tus órdenes.
          </p>
          <Link href="/iniciar-sesion" className="btn-primary mt-6 inline-block">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store py-12 animate-fade-in">
      <h1 className="font-heading text-3xl font-medium text-on-surface">Mis órdenes</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-surface-container p-8 text-center">
          <p className="font-body text-base text-on-surface-variant">
            No tienes órdenes aún.
          </p>
          <Link href="/fundas" className="btn-primary mt-4 inline-block">
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {orders.map(order => (
            <Link
              key={order.id}
              href={`/orden?id=${order.id}`}
              className="rounded-xl border border-outline-variant/50 bg-surface p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-on-surface-variant">
                    Orden
                  </p>
                  <p className="font-heading text-sm font-medium text-on-surface">{order.id}</p>
                </div>
                <span className={`rounded-full px-3 py-1 font-body text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm font-body text-on-surface-variant">
                <span>{new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</span>
                <span className="font-medium text-on-surface">{formatPrice(order.total)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {order.items.slice(0, 3).map((item, i) => (
                  <span key={i} className="rounded-md bg-surface-container-low px-2 py-1 font-body text-xs text-on-surface-variant">
                    {item.name} x{item.quantity}
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="rounded-md bg-surface-container-low px-2 py-1 font-body text-xs text-on-surface-variant">
                    +{order.items.length - 3} más
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
