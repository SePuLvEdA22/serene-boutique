'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/Spinner';
import { loginSchema, formatZodErrors } from '@/lib/validation';

export default function IniciarSesionPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const result = loginSchema.safeParse(data);
    if (!result.success) {
      setErrors(formatZodErrors(result.error.issues));
      return;
    }

    setLoading(true);
    const err = await login(data.email, data.password);

    if (err) {
      setErrors({ form: err });
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

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
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
            />
            {errors.password && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.password}</p>}
          </div>
          {errors.form && <p className="font-body text-sm text-error" role="alert">{errors.form}</p>}
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
