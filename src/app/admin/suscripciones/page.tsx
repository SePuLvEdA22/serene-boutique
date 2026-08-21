'use client';

import { useState, useMemo } from 'react';
import { useAdminFetch, readApiError } from '@/lib/use-admin-fetch';
import SearchInput from '@/components/admin/SearchInput';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string;
  consentAt?: string;
}

const PAGE_SIZE = 10;

export default function AdminSubscribersPage() {
  const { data, loading, reload } = useAdminFetch<{ subscribers: Subscriber[] }>('/api/admin/subscribers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribers = useMemo(() => data?.subscribers ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.email.toLowerCase().includes(q));
  }, [subscribers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const header = ['Email', 'Fecha de suscripción', 'Consentimiento'];
    const rows = filtered.map((s) => [
      s.email,
      new Date(s.subscribedAt).toLocaleDateString('es-MX'),
      s.consentAt ? new Date(s.consentAt).toLocaleDateString('es-MX') : 'No registrado',
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suscriptores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeSubscriber = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/subscribers/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      reload();
    } catch {
      setError('No se pudo eliminar la suscripción');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-56 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Suscripciones"
        subtitle={`${subscribers.length} suscriptores al newsletter`}
        actions={
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-lg bg-primary px-3 py-2 font-body text-sm text-on-primary transition-colors hover:opacity-90 disabled:opacity-40"
          >
            Exportar CSV
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por email..." label="Buscar suscriptores" />
        {error && <p className="font-body text-sm text-error">{error}</p>}
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title={subscribers.length === 0 ? 'No hay suscriptores aún.' : 'Sin resultados para la búsqueda'}
          description={subscribers.length === 0 ? 'Los emails suscritos al newsletter aparecerán aquí.' : 'Prueba con otro email.'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Consentimiento</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((sub) => (
                  <tr key={sub.id} className="border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface-container-low/60">
                    <td className="px-4 py-3 font-medium text-on-surface">{sub.email}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {new Date(sub.subscribedAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {sub.consentAt ? new Date(sub.consentAt).toLocaleDateString('es-MX') : 'No registrado'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeSubscriber(sub.id)}
                        disabled={busyId === sub.id}
                        className="btn-ghost text-xs text-error hover:text-error"
                      >
                        {busyId === sub.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
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