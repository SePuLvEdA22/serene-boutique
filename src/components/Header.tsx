'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CartIcon from './CartIcon';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/fundas', label: 'Fundas' },
  { href: '/cargadores', label: 'Cargadores' },
  { href: '/termos', label: 'Termos' },
  { href: '/personalizados', label: 'Personalizados' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout, wishlist } = useAuth();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, handleEscape]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/50 bg-surface/80 backdrop-blur-md">
      <div className="container-store flex h-16 items-center justify-between">
        <Link href="/" className="font-heading text-2xl font-medium tracking-tight text-on-surface">
          Switch&Tech
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegación principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-body text-sm font-medium uppercase tracking-widest transition-colors hover:text-primary ${
                pathname === link.href
                  ? 'text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/buscar"
            className="p-2 transition-colors hover:text-primary"
            aria-label="Buscar productos"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
          <Link
            href="/favoritos"
            className="relative p-2 transition-colors hover:text-primary"
            aria-label="Favoritos"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            {wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-on-error">
                {wishlist.length > 9 ? '9+' : wishlist.length}
              </span>
            )}
          </Link>
          <CartIcon />
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-on-surface-variant">{user.name}</span>
                <button onClick={logout} className="font-body text-xs text-on-surface-variant underline transition-colors hover:text-primary">
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/iniciar-sesion"
                className="font-body text-xs font-medium uppercase tracking-widest text-on-surface-variant transition-colors hover:text-primary"
              >
                Entrar
              </Link>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 md:hidden"
            aria-label="Menú de navegación"
            aria-expanded={mobileOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={menuRef}
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="border-t border-outline-variant/50 bg-surface px-6 py-4" aria-label="Navegación móvil">
          <ul className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-md px-4 py-3 font-body text-sm font-medium uppercase tracking-widest transition-colors ${
                    pathname === link.href
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
