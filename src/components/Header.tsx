'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/50 bg-surface/80 backdrop-blur-md">
      <div className="container-store flex h-16 items-center justify-between">
        <Link href="/" className="font-heading text-2xl font-medium tracking-tight text-on-surface">
          Switch&Tech
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
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
          <CartIcon />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 md:hidden"
            aria-label="Menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-outline-variant/50 bg-surface md:hidden">
          <nav className="container-store flex flex-col gap-2 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-4 py-3 font-body text-sm font-medium uppercase tracking-widest transition-colors ${
                  pathname === link.href
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
