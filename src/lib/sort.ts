/**
 * Helpers genéricos para ordenar tablas del admin.
 *
 * `applySort` acepta cualquier clave del objeto y compara valores de forma
 * segura (string, número o fechas ISO).
 */
export type SortDirection = 'asc' | 'desc';

export interface SortState<T extends string> {
  key: T;
  direction: SortDirection;
}

export function toggleDirection(key: string, current: SortState<string> | null): SortState<string> {
  if (!current) return { key, direction: 'asc' };
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { key, direction: 'asc' };
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    if (aLower < bLower) return -1;
    if (aLower > bLower) return 1;
    return 0;
  }

  const aTime = new Date(a as string).getTime();
  const bTime = new Date(b as string).getTime();
  if (Number.isFinite(aTime) && Number.isFinite(bTime)) return aTime - bTime;

  return 0;
}

export function applySort<T>(items: T[], key: keyof T, direction: SortDirection): T[] {
  const dir = direction === 'asc' ? 1 : -1;
  return [...items].sort((x, y) => compareValues(x[key], y[key]) * dir);
}

export function applySortState<T>(items: T[], sort: SortState<string> | null): T[] {
  if (!sort) return items;
  return applySort(items, sort.key as keyof T, sort.direction);
}