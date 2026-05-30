'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Credenciales inválidas');
      }

      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Email
              </label>
              <input id="email" name="email" type="email" className="input-field" required />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Contraseña
              </label>
              <input id="password" name="password" type="password" className="input-field" required />
            </div>
            {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}
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
