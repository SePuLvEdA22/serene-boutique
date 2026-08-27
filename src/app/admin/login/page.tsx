'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/components/Spinner';
import { adminLoginSchema, formatZodErrors } from '@/lib/validation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Defensa: si alguien llegó con ?email=...&password=... (submit nativo GET
  // por hidratación fallida o link compartido), limpiar la URL de inmediato
  // para que no quede en historial ni Referer. No loguear valores.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('password') || url.searchParams.has('email')) {
      url.searchParams.delete('password');
      url.searchParams.delete('email');
      // Usar replace para no dejar la URL con creds en el historial
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      console.warn('[admin-login] URL con credenciales limpiada');
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const result = adminLoginSchema.safeParse(data);
    if (!result.success) {
      setErrors(formatZodErrors(result.error.issues));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Credenciales inválidas');
      }

      router.push('/admin');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Error al iniciar sesión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-container-low p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-2xl bg-surface p-8 shadow-medium">
          <div className="mb-6 text-center">
            <Link href="/" className="font-heading text-2xl font-medium tracking-tight text-on-surface">
              Switch&Tech
            </Link>
            <p className="mt-1 font-body text-sm text-on-surface-variant">Panel de administración</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="email" className="admin-label mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className={`input-field ${errors.email ? 'border-error' : ''}`}
                required
              />
              {errors.email && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="admin-label mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={`input-field ${errors.password ? 'border-error' : ''}`}
                required
              />
              {errors.password && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.password}</p>}
            </div>
            {errors.form && <p className="font-body text-sm text-error" role="alert">{errors.form}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Spinner /> Ingresando...</span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
