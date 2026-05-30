'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegistrarsePage() {
  const router = useRouter();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirm') as HTMLInputElement).value;

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const err = await register(name, email, password);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="container-store flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-medium text-on-surface">¡Registro exitoso!</h1>
          <p className="mt-2 font-body text-base text-on-surface-variant">
            Ahora puedes iniciar sesión con tu cuenta.
          </p>
          <Link href="/iniciar-sesion" className="btn-primary mt-6 inline-block">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="font-heading text-3xl font-medium text-on-surface md:text-4xl text-center">
          Crear cuenta
        </h1>
        <p className="mt-2 text-center font-body text-base text-on-surface-variant">
          Regístrate para guardar tus favoritos y agilizar tus compras.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="name" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Nombre
            </label>
            <input id="name" name="name" type="text" className="input-field" required />
          </div>
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
          <div>
            <label htmlFor="confirm" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Confirmar contraseña
            </label>
            <input id="confirm" name="confirm" type="password" className="input-field" required minLength={6} />
          </div>
          {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full">
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-on-surface-variant">
          ¿Ya tienes cuenta?{' '}
          <Link href="/iniciar-sesion" className="text-primary underline transition-colors hover:text-primary/80">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
