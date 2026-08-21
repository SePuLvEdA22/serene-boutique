'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/use-admin-fetch';
import SearchInput from '@/components/admin/SearchInput';
import PageHeader from '@/components/admin/PageHeader';
import Pagination from '@/components/admin/Pagination';
import EmptyState from '@/components/admin/EmptyState';

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const PAGE_SIZE = 10;

export default function AdminUsuariosPage() {
  const { data, loading } = useAdminFetch<{ users: AdminUser[] }>('/api/admin/users');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const users = useMemo(() => data?.users ?? [], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Usuarios"
        subtitle={`${filtered.length} ${filtered.length === 1 ? 'usuario' : 'usuarios'} registrados`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por nombre o email..." label="Buscar usuarios" />
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title={users.length === 0 ? 'No hay usuarios registrados.' : 'Sin resultados para la búsqueda'}
          description={users.length === 0 ? 'Los clientes que se registren aparecerán aquí.' : 'Prueba con otro nombre o email.'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface-container-low/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container/60 font-body text-xs font-semibold text-on-primary-container">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <Link href={`/admin/usuarios/${encodeURIComponent(user.id)}`} className="font-medium text-primary underline transition-colors hover:text-primary/80">
                          {user.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
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