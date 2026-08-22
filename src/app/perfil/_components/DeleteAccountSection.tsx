'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { XIcon } from './icons';

export default function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Ingresa tu contraseña para confirmar');
      return;
    }

    setDeleteLoading(true);
    const err = await deleteAccount(deletePassword);
    setDeleteLoading(false);

    if (err) {
      setDeleteError(err);
    } else {
      addToast('Cuenta eliminada correctamente', 'success');
      router.push('/');
    }
  };

  return (
    <section className="rounded-2xl border border-error/30 bg-error/5 p-6">
      <h2 className="font-heading text-lg font-medium text-on-surface">
        Eliminar mi cuenta
      </h2>
      <p className="mt-1 font-body text-sm text-on-surface-variant">
        Al eliminar tu cuenta se borran tus datos personales, órdenes y
        suscripción al newsletter (derecho de cancelación, Ley 1581). Esta
        acción no se puede deshacer.
      </p>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-4 rounded-xl border border-error/40 px-6 py-2.5 font-body text-sm font-medium text-error transition-all hover:bg-error/10"
        >
          Solicitar eliminación de mis datos
        </button>
      ) : (
        <form onSubmit={handleDeleteAccount} className="mt-4 flex flex-col gap-3">
          <label htmlFor="delete-password" className="input-label">
            Confirma tu contraseña
          </label>
          <input
            id="delete-password"
            type="password"
            value={deletePassword}
            onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
            className="input-field"
            placeholder="••••••••"
            required
          />
          {deleteError && (
            <p className="font-body text-sm text-error flex items-center gap-1">
              <XIcon className="text-error shrink-0" />
              {deleteError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={deleteLoading}
              className="rounded-xl border border-error/40 px-6 py-2.5 font-body text-sm font-medium text-error transition-all hover:bg-error/10"
            >
              {deleteLoading ? 'Eliminando...' : 'Eliminar definitivamente'}
            </button>
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); setDeletePassword(''); setDeleteError(''); }}
              className="rounded-xl border border-outline-variant/50 px-6 py-2.5 font-body text-sm font-medium text-on-surface-variant transition-all hover:bg-surface-container"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
