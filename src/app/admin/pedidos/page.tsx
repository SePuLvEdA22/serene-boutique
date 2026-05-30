'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/products';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  shipping: { name: string; email: string };
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-primary-container text-on-primary-container',
  processing: 'bg-secondary-container text-on-secondary-container',
  shipped: 'bg-tertiary-container text-on-tertiary-container',
  delivered: 'bg-green-100 text-green-600',
  cancelled: 'bg-error-container text-on-error-container',
};

export default function AdminPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => {
        if (res.status === 401) { router.push('/admin/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setOrders(data.orders || []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 font-heading text-2xl font-medium text-on-surface md:text-3xl">Pedidos</h1>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <p className="font-body text-lg text-on-surface-variant">No hay pedidos aún.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/50 bg-surface">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-outline-variant/50 text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((order) => (
                <tr key={order.id} className="border-b border-outline-variant/30 transition-colors hover:bg-surface-container-low">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${encodeURIComponent(order.id)}`} className="font-medium text-primary underline transition-colors hover:text-primary/80">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{order.shipping.name}</td>
                  <td className="px-4 py-3 text-on-surface">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`chip text-[10px] ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {new Date(order.createdAt).toLocaleDateString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
