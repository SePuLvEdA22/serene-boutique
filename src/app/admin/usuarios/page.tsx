'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const PAGE_SIZE = 10;

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => {
        if (res.status === 401) { router.push('/admin/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setUsers(data.users || []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
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
      <h1 className="mb-6 font-heading text-2xl font-medium text-on-surface md:text-3xl">Usuarios</h1>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o email..."
          className="input-field sm:max-w-xs"
          aria-label="Buscar usuarios"
        />
        <p className="font-body text-sm text-on-surface-variant">
          {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
        </p>
      </div>

      {paginated.length === 0 ? (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <p className="font-body text-lg text-on-surface-variant">
            {users.length === 0 ? 'No hay usuarios registrados.' : 'Sin resultados para la búsqueda'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/50 bg-surface">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-outline-variant/50 text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr key={user.id} className="border-b border-outline-variant/30 transition-colors hover:bg-surface-container-low">
                  <td className="px-4 py-3 font-medium text-on-surface">{user.name}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
