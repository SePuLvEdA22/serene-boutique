'use client';

import type { SortState } from '@/lib/sort';

interface SortableHeaderProps<T extends string> {
  label: string;
  sortKey: T;
  sort: SortState<string> | null;
  onSort: (key: string) => void;
  className?: string;
}

/**
 * Cabecera de columna ordenable. Alterna asc/desc al hacer clic.
 * Compatible con el patrón de state-adjusting-during-render de las páginas.
 */
export default function SortableHeader<T extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className = '',
}: SortableHeaderProps<T>) {
  const active = sort?.key === sortKey;
  const direction = active ? sort.direction : null;

  return (
    <th className={`px-4 py-3 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-on-surface"
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={active ? 'text-primary' : 'opacity-40'}
        >
          {direction === 'asc' ? (
            <path d="M12 19V5M5 12l7-7 7 7" />
          ) : (
            <path d="M12 5v14M19 12l-7 7-7-7" />
          )}
        </svg>
      </button>
    </th>
  );
}