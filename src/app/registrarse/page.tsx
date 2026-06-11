'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/Spinner';
import { registerSchema, formatZodErrors } from '@/lib/validation';

function SuccessState() {
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

export default function RegistrarsePage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirm: formData.get('confirm') as string,
    };

    const result = registerSchema.safeParse(data);
    if (!result.success) {
      setErrors(formatZodErrors(result.error.issues));
      return;
    }

    setLoading(true);
    const err = await register(data.name, data.email, data.password);

    if (err) {
      setErrors({ form: err });
      setLoading(false);
    } else {
      addToast('Cuenta creada correctamente', 'success');
      setSuccess(true);
    }
  };

  if (success) return <SuccessState />;

  return (
    <div className="container-store flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-md animate-fade-in">
        <h1 className="font-heading text-3xl font-medium text-on-surface md:text-4xl text-center">
          Crear cuenta
        </h1>
        <p className="mt-2 text-center font-body text-base text-on-surface-variant">
          Regístrate para guardar tus favoritos y agilizar tus compras.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
          <div>
            <label htmlFor="name" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={`input-field ${errors.name ? 'border-error' : ''}`}
              required
            />
            {errors.name && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`input-field ${errors.email ? 'border-error' : ''}`}
              required
            />
            {errors.email && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`input-field ${errors.password ? 'border-error' : ''}`}
              required
              minLength={6}
            />
            {errors.password && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirm" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              className={`input-field ${errors.confirm ? 'border-error' : ''}`}
              required
              minLength={6}
            />
            {errors.confirm && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.confirm}</p>}
          </div>
          {errors.form && <p className="font-body text-sm text-error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Creando cuenta...
              </span>
            ) : 'Crear cuenta'}
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
