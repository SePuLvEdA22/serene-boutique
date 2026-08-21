'use client';

import { STATUS_COLORS, statusLabel } from '@/lib/admin-constants';

interface StatusBadgeProps {
  status: string;
}

const DOT_COLORS: Record<string, string> = {
  pending: 'var(--color-on-surface-variant)',
  confirmed: 'var(--color-primary)',
  processing: 'var(--color-secondary)',
  shipped: 'var(--color-tertiary)',
  delivered: '#16a34a',
  cancelled: 'var(--color-error)',
};

/** Badge de estado de orden con color consistente en todo el admin. */
export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`chip text-[10px] ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || ''}`}>
      <span className="status-dot" style={{ color: DOT_COLORS[status] || 'currentColor' }} />
      {statusLabel(status)}
    </span>
  );
}