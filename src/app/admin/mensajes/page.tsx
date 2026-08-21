'use client';

import { useState, useMemo } from 'react';
import { useAdminFetch, readApiError } from '@/lib/use-admin-fetch';
import SearchInput from '@/components/admin/SearchInput';
import FilterSelect from '@/components/admin/FilterSelect';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

const PAGE_SIZE = 10;

const readOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'unread', label: 'No leídos' },
  { value: 'read', label: 'Leídos' },
];

export default function AdminMessagesPage() {
  const { data, loading, reload } = useAdminFetch<{ contacts: Contact[] }>('/api/admin/contacts');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);

  const contacts = useMemo(() => data?.contacts ?? [], [data]);
  const unreadCount = useMemo(() => contacts.filter((c) => !c.read).length, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter === 'unread' && c.read) return false;
      if (filter === 'read' && !c.read) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q)
      );
    });
  }, [contacts, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleRead = async (contact: Contact) => {
    setBusyId(contact.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${encodeURIComponent(contact.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !contact.read }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      reload();
    } catch {
      setError('No se pudo actualizar el mensaje');
    } finally {
      setBusyId(null);
    }
  };

  const removeContact = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      reload();
    } catch {
      setError('No se pudo eliminar el mensaje');
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    void removeContact(id);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-56 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Mensajes"
        subtitle={unreadCount > 0 ? `${unreadCount} sin leer` : 'Todos los mensajes leídos'}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por nombre, email o asunto..." label="Buscar mensajes" />
        <FilterSelect value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={readOptions} label="Filtrar por lectura" />
        {error && <p className="font-body text-sm text-error">{error}</p>}
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title={contacts.length === 0 ? 'No hay mensajes aún.' : 'Sin resultados para los filtros'}
          description={contacts.length === 0 ? 'Los mensajes del formulario de contacto aparecerán aquí.' : 'Prueba ajustando la búsqueda o el filtro.'}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {paginated.map((contact) => (
            <div
              key={contact.id}
              className={`admin-card admin-card-pad transition-colors ${contact.read ? '' : 'border-primary/50'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {!contact.read && (
                      <span className="chip bg-primary-container text-on-primary-container text-[10px]">Nuevo</span>
                    )}
                    <h2 className="font-heading text-base font-medium text-on-surface">{contact.subject}</h2>
                  </div>
                  <p className="mt-1 font-body text-xs text-on-surface-variant">
                    {contact.name} · {contact.email} · {new Date(contact.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => toggleRead(contact)}
                    disabled={busyId === contact.id}
                    className="btn-ghost text-xs text-primary hover:text-primary"
                  >
                    {contact.read ? 'Marcar no leído' : 'Marcar leído'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(contact)}
                    disabled={busyId === contact.id}
                    className="btn-ghost text-xs text-error hover:text-error"
                  >
                    {busyId === contact.id ? 'Procesando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-on-surface-variant">
                {contact.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Eliminar mensaje"
        message={confirmDelete ? `¿Eliminar el mensaje "${confirmDelete.subject}" de ${confirmDelete.name}? Esta acción no se puede deshacer.` : ''}
        loading={busyId === confirmDelete?.id}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}