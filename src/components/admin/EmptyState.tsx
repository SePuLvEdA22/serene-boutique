'use client';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
}

/** Estado vacío uniforme para las tablas del admin. */
export default function EmptyState({
  title,
  description,
  action,
  icon = 'M6 3a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V7l-4-4H6zm8 0v4h4M9 13h6m-6 4h6',
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-surface-container py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-on-surface-variant">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icon} />
        </svg>
      </span>
      <p className="mt-4 font-body text-lg font-medium text-on-surface">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md font-body text-sm text-on-surface-variant/80">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}