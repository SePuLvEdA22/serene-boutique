'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/format-price';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  shipping: { name: string; email: string };
}

const PAGE_SIZE = 10;

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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

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

  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter(o => {
      if (status !== 'all' && o.status !== status) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.shipping.name.toLowerCase().includes(q) ||
        o.shipping.email.toLowerCase().includes(q)
      );
    });
  }, [sorted, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 font-heading text-2xl font-medium text-on-surface md:text-3xl">Pedidos</h1>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por ID, cliente o email..."
          className="input-field sm:max-w-xs"
          aria-label="Buscar pedidos"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field sm:w-44" aria-label="Filtrar por estado">
          <option value="all">Todos los estados</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <p className="font-body text-sm text-on-surface-variant">
          {filtered.length} {filtered.length === 1 ? 'pedido' : 'pedidos'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <p className="font-body text-lg text-on-surface-variant">
            {orders.length === 0 ? 'No hay pedidos aún.' : 'Sin resultados para los filtros'}
          </p>
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
              {paginated.map((order) => (
                <tr key={order.id} className="border-b border-outline-variant/30 transition-colors hover:bg-surface-container-low">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${encodeURIComponent(order.id)}`} className="font-medium text-primary underline transition-colors hover:text-primary/80">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    <p>{order.shipping.name}</p>
                    <p className="text-xs">{order.shipping.email}</p>
                  </td>
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border border-outline-variant px-3 py-1.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-3 font-body text-sm text-on-surface-variant">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-outline-variant px-3 py-1.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
