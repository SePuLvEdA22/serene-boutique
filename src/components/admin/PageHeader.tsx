'use client';

import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

/** Encabezado uniforme de páginas del admin con breadcrumb de retorno. */
export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Volver',
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 font-body text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 font-body text-sm text-on-surface-variant">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}