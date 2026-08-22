'use client';

import { useState, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/Spinner';
import { CheckIcon, XIcon } from './icons';

export default function PasswordForm() {
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
  );
}
