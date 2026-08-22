'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Spinner from '@/components/Spinner';
import { CheckIcon, XIcon } from './icons';

export default function ProfileForm() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  if (!user) return null;

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

  return (
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
  );
}
