'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

export default function IniciarSesionPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.currentTarget;
    const err = await login(
      (form.elements.namedItem('email') as HTMLInputElement).value,
      (form.elements.namedItem('password') as HTMLInputElement).value
    );

    if (err) {
      setError(err);
      setLoading(false);
    } else {
      addToast('Sesión iniciada correctamente', 'success');
      router.push('/');
    }
  };

  return (
    <div className="container-store flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="font-heading text-3xl font-medium text-on-surface md:text-4xl text-center">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-center font-body text-base text-on-surface-variant">
          Ingresa tus datos para continuar.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Email
            </label>
            <input id="email" name="email" type="email" className="input-field" required />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Contraseña
            </label>
            <input id="password" name="password" type="password" className="input-field" required minLength={6} />
          </div>
          {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Iniciando sesión...
              </span>
            ) : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-on-surface-variant">
          ¿No tienes cuenta?{' '}
          <Link href="/registrarse" className="text-primary underline transition-colors hover:text-primary/80">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
