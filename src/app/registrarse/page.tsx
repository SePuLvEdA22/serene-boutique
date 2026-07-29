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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface RequirementProps {
  met: boolean;
  label: string;
}

function Requirement({ met, label }: RequirementProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-all duration-300 ${
        met ? 'text-primary' : 'text-outline'
      }`}
    >
      <span
        className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 ${
          met ? 'bg-primary text-on-primary scale-100' : 'bg-surface-container-high text-outline scale-100'
        }`}
      >
        {met ? (
          <CheckIcon className="w-2.5 h-2.5" />
        ) : (
          <XIcon className="w-2.5 h-2.5" />
        )}
      </span>
      <span className="font-body text-xs font-medium">{label}</span>
    </span>
  );
}

export default function RegistrarsePage() {
  const { register } = useAuth();
  const { addToast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Controlled inputs for real-time validation
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Derive password requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const allPasswordMet = hasMinLength && hasUppercase && hasNumber;
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;
  const hasConfirmValue = confirm.length > 0;

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

          {/* Password field */}
          <div>
            <label htmlFor="password" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.password;
                  return next;
                });
              }}
              className={`input-field transition-all duration-200 ${
                errors.password ? 'border-error' :
                password.length > 0 && allPasswordMet ? 'border-primary' : ''
              }`}
              required
              minLength={8}
            />

            {/* Password requirements checklist */}
            {password.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-surface-container/50 border border-outline-variant/50 animate-fade-in">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <Requirement met={hasMinLength} label="8+ caracteres" />
                  <Requirement met={hasUppercase} label="Una mayúscula" />
                  <Requirement met={hasNumber} label="Un número" />
                </div>
                {/* Strength message + progress bar */}
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <div className="h-1 flex-1 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        allPasswordMet ? 'bg-primary' :
                        hasMinLength || hasUppercase || hasNumber ? 'bg-secondary' : 'bg-error/40'
                      }`}
                      style={{
                        width: `${[hasMinLength, hasUppercase, hasNumber].filter(Boolean).length / 3 * 100}%`,
                      }}
                    />
                  </div>
                  <span className={`font-body text-[11px] font-medium whitespace-nowrap transition-all duration-300 ${
                    allPasswordMet ? 'text-primary' : 'text-outline'
                  }`}>
                    {allPasswordMet ? 'Segura' : !hasMinLength ? 'Muy corta' : 'Incompleta'}
                  </span>
                </div>
              </div>
            )}

            {errors.password && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.password}</p>}
          </div>

          {/* Confirm password field */}
          <div>
            <label htmlFor="confirm" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.confirm;
                  return next;
                });
              }}
              className={`input-field transition-all duration-200 ${
                errors.confirm ? 'border-error' :
                hasConfirmValue && passwordsMatch ? 'border-primary' : ''
              }`}
              required
              minLength={8}
            />

            {/* Real-time match indicator */}
            {hasConfirmValue && (
              <div className="mt-2 animate-fade-in">
                {passwordsMatch ? (
                  <p className="flex items-center gap-1.5 font-body text-xs text-primary">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-on-primary">
                      <CheckIcon className="w-2.5 h-2.5" />
                    </span>
                    Las contraseñas coinciden
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 font-body text-xs text-error">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-error text-on-error">
                      <XIcon className="w-2.5 h-2.5" />
                    </span>
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            )}

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
