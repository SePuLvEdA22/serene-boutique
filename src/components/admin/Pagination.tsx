'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Paginación reutilizable del admin (reemplaza la copia en 4 páginas). */
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const current = Math.min(Math.max(page, 1), totalPages);

  const navButton =
    'inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface hover:text-on-surface disabled:opacity-40';

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className={navButton}
        aria-label="Página anterior"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Anterior
      </button>
      <span className="chip bg-primary-container text-on-primary-container">
        Página {current} de {totalPages}
      </span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= totalPages}
        className={navButton}
        aria-label="Página siguiente"
      >
        Siguiente
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}