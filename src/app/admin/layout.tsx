'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/productos', label: 'Productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/admin/inventario', label: 'Inventario', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/promociones', label: 'Promociones', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  { href: '/admin/suscripciones', label: 'Suscripciones', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { href: '/admin/mensajes', label: 'Mensajes', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { href: '/admin/configuracion', label: 'Configuración', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(() => pathname !== '/admin/login');
  const [unreadContacts, setUnreadContacts] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/admin/login';

  // Ajuste de estado durante el render (patrón recomendado): al cambiar de ruta,
  // cierra el menú móvil sin setState síncrono dentro de un effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  useEffect(() => {
    if (isLoginPage) {
      return;
    }
    fetch('/api/admin/stats')
      .then(res => {
        if (res.status === 401) {
          router.replace('/admin/login');
          return null;
        }
        return res.json().catch(() => null);
      })
      .then(data => {
        if (data && typeof data.unreadContacts === 'number') {
          setUnreadContacts(data.unreadContacts);
        }
      })
      .catch(() => {
        router.replace('/admin/login');
      })
      .finally(() => setChecking(false));
  }, [isLoginPage, router]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (sidebarOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen, handleEscape]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-container-low">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-surface-container-low">
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={menuRef}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-outline-variant/50 bg-surface-container-low transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-outline-variant/50 px-5">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-heading text-sm font-semibold text-on-primary">
              ST
            </span>
            <span className="leading-tight">
              <span className="block font-heading text-lg font-medium tracking-tight text-on-surface">Switch&Tech</span>
              <span className="block font-body text-[11px] text-on-surface-variant">Panel de administración</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-on-surface-variant hover:text-on-surface md:hidden"
            aria-label="Cerrar menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4" aria-label="Navegación administrador">
          <p className="admin-label mb-1 px-4">Gestión</p>
          {sidebarLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 font-body text-sm transition-colors ${
                  active
                    ? 'bg-primary-container text-on-primary-container font-medium'
                    : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                }`}
              >
                {active && (
                  <span
                    className="absolute -left-4 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={link.icon} />
                </svg>
                {link.label}
                {link.href === '/admin/mensajes' && unreadContacts > 0 && (
                  <span className="ml-auto rounded-full bg-error px-2 py-0.5 text-[10px] font-semibold text-on-error">
                    {unreadContacts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-outline-variant/50 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface hover:text-on-surface"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ver tienda
          </Link>
        </div>

      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-outline-variant/50 bg-surface/80 px-4 backdrop-blur md:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-on-surface-variant hover:text-on-surface md:hidden"
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="hidden md:block">
            <p className="font-heading text-lg font-medium text-on-surface">
              {sidebarLinks.find(l => pathname === l.href || (l.href !== '/admin' && pathname.startsWith(l.href)))?.label || 'Panel de administración'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetch('/api/admin/login', { method: 'DELETE' }).then(() => {
                  router.push('/admin/login');
                });
              }}
              className="btn-ghost"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
