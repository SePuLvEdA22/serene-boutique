'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/format-price';
import Spinner from '@/components/Spinner';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface OrderSummary {
  id: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function PerfilPage() {
  const { user, loading, logout } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Name form
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Orders
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders((data.orders || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

  // Real-time password validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const allPasswordMet = hasMinLength && hasUppercase && hasNumber;
  const passwordsMatch = newPassword.length > 0 && confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  const strengthLabel = !newPassword
    ? ''
    : allPasswordMet
    ? 'Segura'
    : !hasMinLength
    ? 'Muy corta'
    : 'Incompleta';

  const strengthColor = !newPassword
    ? ''
    : allPasswordMet
    ? 'text-primary'
    : 'text-error';

  if (loading) {
    return (
      <div className="container-store py-12">
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-store py-12">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-outline" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p className="mt-4 font-body text-lg text-on-surface-variant">
            Inicia sesión para ver tu perfil
          </p>
          <Link
            href="/iniciar-sesion"
            className="mt-6 btn-primary"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  const handleNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess(false);

    if (name.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setNameSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'name', name: name.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNameError(data.error || 'Error al actualizar');
        return;
      }

      setNameSuccess(true);
      addToast('Nombre actualizado correctamente', 'success');

      // Refresh user data recargando la página para que el header se actualice
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setNameError('Error de conexión');
    } finally {
      setNameSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Ingresa tu contraseña actual');
      return;
    }
    if (!allPasswordMet) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres, una mayúscula y un número');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'password', currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Error al cambiar contraseña');
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      addToast('Contraseña actualizada correctamente', 'success');
    } catch {
      setPasswordError('Error de conexión');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="container-store py-12 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm font-body text-on-surface-variant">
        <Link href="/" className="transition-colors hover:text-primary">Inicio</Link>
        <span aria-hidden="true">/</span>
        <span className="text-on-surface font-medium">Mi Perfil</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-on-primary">
            {user.name
              ?.split(' ')
              .map(w => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || '?'}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-medium text-on-surface">
              {user.name}
            </h1>
            <p className="font-body text-sm text-on-surface-variant">{user.email}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* ─── EDITAR NOMBRE ─── */}
          <section className="rounded-2xl border border-outline-variant/50 bg-surface p-6">
            <h2 className="font-heading text-lg font-medium text-on-surface">
              Información personal
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Actualiza tu nombre público en la tienda.
            </p>

            <form onSubmit={handleNameSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="input-label">
                  Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                    setNameSuccess(false);
                  }}
                  className={`input-field ${nameError ? 'border-error' : nameSuccess ? 'border-primary' : ''}`}
                  placeholder="Tu nombre"
                  required
                />
                {nameError && (
                  <p className="mt-1.5 font-body text-xs text-error flex items-center gap-1">
                    <XIcon className="text-error" />
                    {nameError}
                  </p>
                )}
                {nameSuccess && (
                  <p className="mt-1.5 font-body text-xs text-primary flex items-center gap-1">
                    <CheckIcon className="text-primary" />
                    Nombre actualizado
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="input-label">Correo electrónico</label>
                  <p className="input-field flex items-center bg-surface-container/50 text-on-surface-variant cursor-not-allowed">
                    {user.email}
                  </p>
                  <p className="mt-1 font-body text-xs text-on-surface-variant">
                    El correo no se puede cambiar actualmente.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={nameSaving || name.trim() === user.name}
                className="btn-primary text-sm"
              >
                {nameSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Guardando...
                  </span>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </form>
          </section>

          {/* ─── CAMBIAR CONTRASEÑA ─── */}
          <section className="rounded-2xl border border-outline-variant/50 bg-surface p-6">
            <h2 className="font-heading text-lg font-medium text-on-surface">
              Cambiar contraseña
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Elige una contraseña segura que no uses en otros sitios.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="current-password" className="input-label">
                  Contraseña actual
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError('');
                    setPasswordSuccess(false);
                  }}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="new-password" className="input-label">
                  Nueva contraseña
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError('');
                    setPasswordSuccess(false);
                  }}
                  className={`input-field ${
                    newPassword.length > 0
                      ? allPasswordMet
                        ? 'border-primary'
                        : 'border-error/30'
                      : ''
                  }`}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />

                {newPassword.length > 0 && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`transition-all duration-500 ease-out rounded-full ${
                            hasMinLength && hasUppercase && hasNumber
                              ? 'bg-primary'
                              : hasMinLength || hasUppercase || hasNumber
                              ? 'bg-secondary'
                              : 'bg-error/40'
                          }`}
                          style={{
                            width: `${[hasMinLength, hasUppercase, hasNumber].filter(Boolean).length / 3 * 100}%`,
                          }}
                        />
                      </div>
                      <span className={`font-body text-xs font-medium ${strengthColor}`}>
                        {strengthLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { label: '8+ caracteres', met: hasMinLength },
                        { label: 'Una mayúscula', met: hasUppercase },
                        { label: 'Un número', met: hasNumber },
                      ].map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-body transition-colors ${
                            req.met
                              ? 'bg-primary-container/40 text-primary'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {req.met ? (
                            <CheckIcon className="text-primary" />
                          ) : (
                            <XIcon className="text-outline" />
                          )}
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="input-label">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setPasswordError('');
                    setPasswordSuccess(false);
                  }}
                  className={`input-field ${
                    confirmNewPassword.length > 0
                      ? passwordsMatch
                        ? 'border-primary'
                        : 'border-error/50'
                      : ''
                  }`}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
                {confirmNewPassword.length > 0 && (
                  <p className={`mt-1.5 font-body text-xs flex items-center gap-1 ${
                    passwordsMatch ? 'text-primary' : 'text-error'
                  }`}>
                    {passwordsMatch ? (
                      <><CheckIcon className="text-primary" /> Las contraseñas coinciden</>
                    ) : (
                      <><XIcon className="text-error" /> Las contraseñas no coinciden</>
                    )}
                  </p>
                )}
              </div>

              {passwordError && (
                <p className="font-body text-sm text-error flex items-center gap-1">
                  <XIcon className="text-error shrink-0" />
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p className="font-body text-sm text-primary flex items-center gap-1">
                  <CheckIcon className="text-primary shrink-0" />
                  Contraseña actualizada correctamente
                </p>
              )}

              <button
                type="submit"
                disabled={passwordSaving}
                className="btn-primary text-sm"
              >
                {passwordSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Guardando...
                  </span>
                ) : (
                  'Cambiar contraseña'
                )}
              </button>
            </form>
          </section>

          {/* ─── ÚLTIMAS ÓRDENES ─── */}
          <section className="rounded-2xl border border-outline-variant/50 bg-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-medium text-on-surface">
                  Últimas órdenes
                </h2>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  Resumen de tus compras recientes.
                </p>
              </div>
              <Link
                href="/mis-ordenes"
                className="font-body text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Ver todas
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {ordersLoading ? (
                <>
                  <div className="h-20 animate-pulse rounded-xl bg-surface-container-high" />
                  <div className="h-20 animate-pulse rounded-xl bg-surface-container-high" />
                </>
              ) : orders.length === 0 ? (
                <div className="rounded-xl bg-surface-container p-6 text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-outline" aria-hidden="true">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="mt-2 font-body text-sm text-on-surface-variant">
                    No tienes órdenes aún.
                  </p>
                  <Link href="/fundas" className="mt-3 inline-block font-body text-sm font-medium text-primary transition-colors hover:text-primary/80">
                    Ver productos
                  </Link>
                </div>
              ) : (
                orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orden?id=${order.id}`}
                    className="flex items-start justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 transition-all hover:border-outline-variant hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        <span className="font-body text-xs text-on-surface-variant">
                          {new Date(order.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="mt-1.5 font-body text-sm font-medium text-on-surface truncate">{order.id}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {order.items.slice(0, 2).map((item, i) => (
                          <span key={i} className="rounded-md bg-surface-container px-2 py-0.5 font-body text-[11px] text-on-surface-variant">
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="rounded-md bg-surface-container px-2 py-0.5 font-body text-[11px] text-on-surface-variant">
                            +{order.items.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-heading text-sm font-medium text-on-surface">{formatPrice(order.total)}</p>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto mt-1 text-outline" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* ─── CERRAR SESIÓN ─── */}
          <section className="rounded-2xl border border-outline-variant/50 bg-surface p-6">
            <h2 className="font-heading text-lg font-medium text-on-surface">
              Sesión
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Si cierras sesión, tendrás que iniciarla nuevamente para hacer compras.
            </p>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="mt-4 rounded-xl border border-error/40 px-6 py-2.5 font-body text-sm font-medium text-error transition-all hover:bg-error/5"
            >
              Cerrar sesión
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
