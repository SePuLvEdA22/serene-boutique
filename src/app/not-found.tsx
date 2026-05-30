import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-store flex flex-1 items-center justify-center py-20">
      <div className="max-w-md text-center">
        <p className="font-heading text-8xl font-semibold text-primary/30">404</p>
        <h1 className="mt-4 font-heading text-3xl font-medium text-on-surface">
          Página no encontrada
        </h1>
        <p className="mt-3 font-body text-base leading-relaxed text-on-surface-variant">
          La página que buscas no existe o fue movida. Revisa la URL o vuelve al inicio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-primary">
            Volver al inicio
          </Link>
          <Link href="/fundas" className="btn-secondary">
            Ver productos
          </Link>
        </div>
      </div>
    </div>
  );
}
