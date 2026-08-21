'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook para consumir las rutas API del admin de forma consistente.
 *
 * - Redirige a /admin/login automáticamente ante un 401.
 * - `loading` se deriva de `data === null` (sin `setState` síncrono en effects,
 *   cumpliendo la regla react-hooks/set-state-in-effect).
 * - Expone `reload()` para refrescar los datos tras una mutación.
 */
export function useAdminFetch<T>(url: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json) return;
        setData(json as T);
      })
      .catch((err) => {
        if (cancelled || (err as Error).name === 'AbortError') return;
        setError('Error al cargar los datos');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, requestId, router]);

  const reload = useCallback(() => setRequestId((id) => id + 1), []);

  return { data, error, loading: data === null && error === null, reload };
}

/** Helper para respuestas de error uniformes en el admin. */
export async function readApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.error === 'string' ? body.error : 'Error inesperado';
  } catch {
    return 'Error inesperado';
  }
}