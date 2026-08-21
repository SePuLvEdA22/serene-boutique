import type { OrderStatus } from '@/lib/models';
import type { Category } from '@/lib/models';

/** Etiquetas en español para cada estado de orden. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

/** Orden lógico del flujo de una orden (para filtros y workflow). */
export const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

/** Clases de color (Tailwind) para badges de estado. */
export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  confirmed: 'bg-primary-container text-on-primary-container',
  processing: 'bg-secondary-container text-on-secondary-container',
  shipped: 'bg-tertiary-container text-on-tertiary-container',
  delivered: 'bg-green-100 text-green-600',
  cancelled: 'bg-error-container text-on-error-container',
};

/** Estados que requieren atención del admin (no finalizados). */
export const ATTENTION_STATUSES: OrderStatus[] = ['pending', 'confirmed'];

/** Umbral de stock para considerar un producto con "poco stock". */
export const LOW_STOCK_THRESHOLD = 10;

export const CATEGORY_LABELS: Record<Category, string> = {
  fundas: 'Fundas',
  cargadores: 'Cargadores',
  termos: 'Termos',
  personalizados: 'Personalizados',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] || status;
}