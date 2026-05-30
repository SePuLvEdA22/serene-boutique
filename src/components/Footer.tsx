import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-outline-variant/50 bg-surface-container-low">
      <div className="container-store py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="font-heading text-2xl font-medium tracking-tight text-on-surface">
              Switch&Tech
            </Link>
            <p className="mt-3 font-body text-sm leading-relaxed text-on-surface-variant">
              Accesorios tecnológicos con estilo. Calidad y diseño que inspiran.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-body text-xs font-medium uppercase tracking-[0.15em] text-on-surface-variant">
              Categorías
            </h3>
            <ul className="flex flex-col gap-2">
              {[
                { href: '/fundas', label: 'Fundas' },
                { href: '/cargadores', label: 'Cargadores' },
                { href: '/termos', label: 'Termos' },
                { href: '/personalizados', label: 'Personalizados' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-body text-xs font-medium uppercase tracking-[0.15em] text-on-surface-variant">
              Ayuda
            </h3>
            <ul className="flex flex-col gap-2">
              {[
                { href: '/contacto', label: 'Contacto' },
                { href: '/envios', label: 'Envíos' },
                { href: '/devoluciones', label: 'Devoluciones' },
                { href: '/faq', label: 'FAQ' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-on-surface-variant transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-body text-xs font-medium uppercase tracking-[0.15em] text-on-surface-variant">
              Síguenos
            </h3>
            <div className="flex gap-3">
              {['Instagram', 'Facebook', 'TikTok', 'Pinterest'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-xs text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-outline-variant/50 pt-6 text-center">
          <p className="font-body text-xs text-on-surface-variant">
            &copy; {new Date().getFullYear()} Switch&Tech. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
