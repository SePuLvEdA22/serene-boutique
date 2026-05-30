'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function OrderContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <div className="container-store py-12">
      <div className="mx-auto max-w-lg rounded-2xl bg-surface-container p-8 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-medium text-on-surface">¡Pedido confirmado!</h1>
        <p className="mt-3 font-body text-base text-on-surface-variant">
          Gracias por tu compra. Te enviaremos un correo con los detalles de tu pedido.
        </p>
        {orderId && (
          <div className="mt-6 rounded-lg bg-surface-container-low p-4">
            <p className="font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Número de orden
            </p>
            <p className="mt-1 font-heading text-lg font-medium text-primary">{orderId}</p>
          </div>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-primary">
            Volver al inicio
          </Link>
          <Link href="/fundas" className="btn-secondary">
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrdenPage() {
  return (
    <Suspense fallback={
      <div className="container-store py-12 text-center">
        <div className="h-12 w-48 mx-auto rounded-lg bg-surface-container-high animate-pulse" />
      </div>
    }>
      <OrderContent />
    </Suspense>
  );
}
