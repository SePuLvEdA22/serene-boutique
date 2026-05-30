'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-store flex flex-1 items-center justify-center py-20">
      <div className="max-w-md text-center">
        <p className="font-heading text-8xl font-semibold text-error/30">!</p>
        <h1 className="mt-4 font-heading text-3xl font-medium text-on-surface">
          Algo salió mal
        </h1>
        <p className="mt-3 font-body text-base leading-relaxed text-on-surface-variant">
          Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button onClick={reset} className="btn-primary">
            Intentar de nuevo
          </button>
          <a href="/" className="btn-secondary">
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
