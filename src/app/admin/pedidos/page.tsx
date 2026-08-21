'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/format-price';
import { STATUS_FLOW, STATUS_LABELS } from '@/lib/admin-constants';
import { applySortState, toggleDirection, type SortState } from '@/lib/sort';
import { useAdminFetch, readApiError } from '@/lib/use-admin-fetch';
import SearchInput from '@/components/admin/SearchInput';
import FilterSelect from '@/components/admin/FilterSelect';
import PageHeader from '@/components/admin/PageHeader';
import StatusBadge from '@/components/admin/StatusBadge';
import SortableHeader from '@/components/admin/SortableHeader';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';

interface ApiOrder {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  shipping?: { name: string; email: string };
}

interface OrderRow {
  id: string;
  customer: string;
  email: string;
  total: number;
  status: string;
  date: string;
}

const PAGE_SIZE = 10;

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  ...STATUS_FLOW.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

const bulkStatusOptions = STATUS_FLOW.filter((s) => s !== 'pending').map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export default function AdminPedidosPage() {
  const { data, loading, reload } = useAdminFetch<{ orders: ApiOrder[] }>('/api/admin/orders');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<SortState<string> | null>({ key: 'date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const orders = useMemo(
    () =>
      (data?.orders ?? []).map((o) => ({
        id: o.id,
        customer: o.shipping?.name ?? '',
        email: o.shipping?.email ?? '',
        total: o.total,
        status: o.status,
        date: o.createdAt,
      })),
    [data]
  );

  const rows = useMemo(() => applySortState<OrderRow>(orders, sort), [orders, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toMs = to ? new Date(`${to}T23:59:59.999`).getTime() : null;

    return rows.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      const t = new Date(o.date).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q)
      );
    });
  }, [rows, search, status, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onSort = (key: string) => {
    setSort(toggleDirection(key, sort));
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = paginated.every((o) => next.has(o.id));
      for (const o of paginated) {
        if (allSelected) next.delete(o.id);
        else next.add(o.id);
      }
      return next;
    });
  };

  const applyBulkStatus = async () => {
    if (selected.size === 0 || !bulkStatus) return;
    setBusy(true);
    setBulkError(null);
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], status: bulkStatus }),
      });
      if (!res.ok) {
        setBulkError(await readApiError(res));
        return;
      }
      setSelected(new Set());
      setBulkStatus('');
      reload();
    } catch {
      setBulkError('No se pudieron actualizar los pedidos');
    } finally {
      setBusy(false);
    }
  };

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
      <PageHeader
        title="Pedidos"
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'pedido' : 'pedidos'} en la lista`}
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por ID, cliente o email..." label="Buscar pedidos" />
        <FilterSelect
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={statusOptions}
          label="Filtrar por estado"
        />
        <div className="flex items-center gap-2">
          <label className="font-body text-xs text-on-surface-variant" htmlFor="orders-from">Desde</label>
          <input
            id="orders-from"
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="input-field sm:w-44"
            aria-label="Desde"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-body text-xs text-on-surface-variant" htmlFor="orders-to">Hasta</label>
          <input
            id="orders-to"
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="input-field sm:w-44"
            aria-label="Hasta"
          />
        </div>
        <a
          href={`/api/admin/orders/export?status=${encodeURIComponent(status)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface hover:text-on-surface"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          Exportar CSV
        </a>
      </div>

      {/* Acciones masivas */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-primary-container/20 p-3">
          <p className="font-body text-sm text-on-surface">
            {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
          </p>
          <FilterSelect
            value={bulkStatus}
            onChange={setBulkStatus}
            options={[{ value: '', label: 'Cambiar estado a...' }, ...bulkStatusOptions]}
            label="Cambiar estado a"
          />
          <button
            onClick={applyBulkStatus}
            disabled={busy || !bulkStatus}
            className="rounded-lg bg-primary px-3 py-1.5 font-body text-sm text-on-primary transition-colors hover:opacity-90 disabled:opacity-40"
          >
            {busy ? 'Aplicando...' : 'Aplicar'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-lg px-3 py-1.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Limpiar
          </button>
          {bulkError && <p className="font-body text-sm text-error">{bulkError}</p>}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={orders.length === 0 ? 'No hay pedidos aún.' : 'Sin resultados para los filtros'}
          description={orders.length === 0 ? 'Los pedidos que realicen los clientes aparecerán aquí.' : 'Prueba ajustando la búsqueda, el estado o las fechas.'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos los visibles"
                      checked={paginated.length > 0 && paginated.every((o) => selected.has(o.id))}
                      onChange={toggleAllVisible}
                      className="accent-primary"
                    />
                  </th>
                  <SortableHeader label="Pedido" sortKey="id" sort={sort} onSort={onSort} />
                  <SortableHeader label="Cliente" sortKey="customer" sort={sort} onSort={onSort} />
                  <SortableHeader label="Total" sortKey="total" sort={sort} onSort={onSort} />
                  <SortableHeader label="Estado" sortKey="status" sort={sort} onSort={onSort} />
                  <SortableHeader label="Fecha" sortKey="date" sort={sort} onSort={onSort} />
                </tr>
              </thead>
              <tbody>
                {paginated.map((order) => (
                  <tr key={order.id} className="border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface-container-low/60">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar pedido ${order.id}`}
                        checked={selected.has(order.id)}
                        onChange={() => toggleRow(order.id)}
                        className="accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/pedidos/${encodeURIComponent(order.id)}`} className="font-medium text-primary underline transition-colors hover:text-primary/80">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      <p>{order.customer}</p>
                      <p className="text-xs">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-on-surface">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {new Date(order.date).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}