'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';
import ProfileForm from './_components/ProfileForm';
import PasswordForm from './_components/PasswordForm';
import RecentOrders from './_components/RecentOrders';
import DeleteAccountSection from './_components/DeleteAccountSection';

export default function PerfilPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

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
          <ProfileForm />

          <PasswordForm />

          <RecentOrders />

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

          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}
