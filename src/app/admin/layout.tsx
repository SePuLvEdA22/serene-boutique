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
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }
    fetch('/api/admin/stats')
      .then(res => {
        if (res.status === 401) {
          router.replace('/admin/login');
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-surface shadow-medium transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-outline-variant/50 px-6">
          <Link href="/admin" className="font-heading text-xl font-medium tracking-tight text-on-surface">
            Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 md:hidden"
            aria-label="Cerrar menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4" aria-label="Navegación administrador">
          {sidebarLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 font-body text-sm transition-colors ${
                  active
                    ? 'bg-primary-container text-on-primary-container font-medium'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={link.icon} />
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-outline-variant/50 bg-surface px-4 md:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 md:hidden"
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
              className="font-body text-xs text-on-surface-variant underline transition-colors hover:text-primary"
            >
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
