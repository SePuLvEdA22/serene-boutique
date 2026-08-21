'use client';

import { useState, useMemo } from 'react';
import { useAdminFetch, readApiError } from '@/lib/use-admin-fetch';
import SearchInput from '@/components/admin/SearchInput';
import FilterSelect from '@/components/admin/FilterSelect';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface Promo {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  active: boolean;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

const typeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'percent', label: 'Porcentaje' },
  { value: 'fixed', label: 'Monto fijo' },
];

const emptyForm = {
  code: '',
  type: 'percent' as 'percent' | 'fixed',
  value: '',
  minOrder: '',
  active: true,
  usageLimit: '',
  expiresAt: '',
};

export default function AdminPromosPage() {
  const { data, loading, reload } = useAdminFetch<{ promos: Promo[] }>('/api/admin/promos');
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Promo | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const promos = useMemo(() => data?.promos ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return promos.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (!q) return true;
      return p.code.toLowerCase().includes(q);
    });
  }, [promos, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (promo: Promo) => {
    setForm({
      code: promo.code,
      type: promo.type,
      value: String(promo.value),
      minOrder: promo.minOrder ? String(promo.minOrder) : '',
      active: promo.active,
      usageLimit: promo.usageLimit ? String(promo.usageLimit) : '',
      expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
    });
    setEditingId(promo.id);
    setError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setError(null);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : 0,
      active: form.active,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };

    try {
      const url = editingId ? `/api/admin/promos/${encodeURIComponent(editingId)}` : '/api/admin/promos';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      closeForm();
      reload();
    } catch {
      setError('No se pudo guardar la promoción');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (promo: Promo) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/promos/${encodeURIComponent(promo.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !promo.active }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      reload();
    } catch {
      setError('No se pudo actualizar la promoción');
    } finally {
      setBusy(false);
    }
  };

  const removePromo = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/promos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      reload();
    } catch {
      setError('No se pudo eliminar la promoción');
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    void removePromo(id);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-56 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  const formTitle = editingId ? 'Editar promoción' : 'Nueva promoción';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Promociones"
        subtitle="Cupones de descuento aplicables en el checkout"
        actions={
          <button
            onClick={openCreate}
            className="rounded-lg bg-primary px-3 py-2 font-body text-sm text-on-primary transition-colors hover:opacity-90"
          >
            Nueva promoción
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por código..." label="Buscar promociones" />
        <FilterSelect value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={typeOptions} label="Filtrar por tipo" />
      </div>

      {formOpen && (
        <form onSubmit={submitForm} className="admin-card admin-card-pad mb-6 border-primary/50">
          <h2 className="mb-4 font-heading text-lg font-medium text-on-surface">{formTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="admin-label" htmlFor="promo-code">Código</label>
              <input
                id="promo-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
                placeholder="BIENVENIDO10"
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="admin-label" htmlFor="promo-type">Tipo</label>
              <select
                id="promo-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
                className="input-field"
              >
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="admin-label" htmlFor="promo-value">Valor</label>
              <input
                id="promo-value"
                type="number"
                min="1"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="admin-label" htmlFor="promo-minorder">Mínimo de compra ($)</label>
              <input
                id="promo-minorder"
                type="number"
                min="0"
                step="0.01"
                value={form.minOrder}
                onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="admin-label" htmlFor="promo-limit">Límite de usos</label>
              <input
                id="promo-limit"
                type="number"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="admin-label" htmlFor="promo-expires">Vence el</label>
              <input
                id="promo-expires"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 font-body text-sm text-on-surface">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="accent-primary"
            />
            Promoción activa
          </label>
          {error && <p className="mt-3 font-body text-sm text-error">{error}</p>}
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary text-xs">
              {busy ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={closeForm} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {paginated.length === 0 ? (
        <EmptyState
          title={promos.length === 0 ? 'No hay promociones aún.' : 'Sin resultados para los filtros'}
          description={promos.length === 0 ? 'Crea tu primera promoción para ofrecer descuentos en el checkout.' : 'Prueba ajustando la búsqueda o el tipo.'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Descuento</th>
                  <th className="px-4 py-3 font-semibold">Usos</th>
                  <th className="px-4 py-3 font-semibold">Vence</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((promo) => {
                  const expired =
                    promo.expiresAt && new Date(promo.expiresAt).getTime() < now;
                  return (
                    <tr key={promo.id} className="border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface-container-low/60">
                      <td className="px-4 py-3">
                        <span className="chip bg-surface-container-high font-body text-xs font-semibold text-on-surface">{promo.code}</span>
                      </td>
                      <td className="px-4 py-3 text-on-surface">
                        {promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`}
                        {promo.minOrder > 0 && (
                          <span className="ml-1 text-xs text-on-surface-variant">(mín ${promo.minOrder})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {promo.usedCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ''}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {promo.expiresAt
                          ? `${new Date(promo.expiresAt).toLocaleDateString('es-MX')}${expired ? ' (vencida)' : ''}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`chip text-[10px] ${promo.active && !expired ? 'bg-green-100 text-green-600' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {promo.active && !expired ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => toggleActive(promo)}
                            disabled={busy}
                            className="btn-ghost text-xs text-primary hover:text-primary"
                          >
                            {promo.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => openEdit(promo)}
                            disabled={busy}
                            className="btn-ghost text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(promo)}
                            disabled={busy}
                            className="btn-ghost text-xs text-error hover:text-error"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Eliminar promoción"
        message={confirmDelete ? `¿Eliminar la promoción "${confirmDelete.code}"? Esta acción no se puede deshacer.` : ''}
        loading={busy && confirmDelete !== null}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}