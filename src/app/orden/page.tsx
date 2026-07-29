'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format-price';
import type { Order } from '@/lib/models';

const STATUS_MESSAGES: Record<string, { title: string; description: string; icon: 'success' | 'pending' | 'error' }> = {
  success: {
    title: '¡Pedido confirmado!',
    description: 'Gracias por tu compra. Te enviaremos un correo con los detalles de tu pedido.',
    icon: 'success',
  },
  pending: {
    title: 'Pago pendiente',
    description: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
    icon: 'pending',
  },
  failure: {
    title: 'Pago no completado',
    description: 'El pago no pudo completarse. Puedes intentar de nuevo desde el carrito.',
    icon: 'error',
  },
};

function StatusIcon({ type }: { type: 'success' | 'pending' | 'error' }) {
  if (type === 'success') {
    return (
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (type === 'pending') {
    return (
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
    );
  }
  return (
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    </div>
  );
}

function PaymentMethodLabel(method?: string): string {
  switch (method) {
    case 'pse':
      return 'PSE (Débito bancario)';
    case 'card':
      return 'Tarjeta de crédito/débito';
    default:
      return 'No especificado';
  }
}

function OrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const status = (searchParams.get('status') || 'success') as keyof typeof STATUS_MESSAGES;
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    if (!orderId && status !== 'pending') {
      router.replace('/');
    }
  }, [orderId, status, router]);

  // Intentar cargar detalles de la orden
  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      if (!orderId) {
        setLoadingOrder(false);
        return;
      }
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data?.order) setOrder(data.order);
        }
      } catch {
        // Error silencioso
      }
      if (!cancelled) setLoadingOrder(false);
    }

    loadOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loadingOrder && orderId) {
    return (
      <div className="container-store py-12 text-center">
        <div className="mx-auto h-12 w-48 animate-pulse rounded-lg bg-surface-container-high" />
      </div>
    );
  }

  const statusInfo = STATUS_MESSAGES[status] || STATUS_MESSAGES.success;
  const paymentMethod = order?.paymentMethod;

  return (
    <div className="container-store py-12">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-surface-container p-8 text-center animate-fade-in">
          <StatusIcon type={statusInfo.icon} />
          <h1 className="font-heading text-3xl font-medium text-on-surface">
            {statusInfo.title}
          </h1>
          <p className="mt-3 font-body text-base text-on-surface-variant">
            {statusInfo.description}
          </p>

          {orderId && (
            <div className="mt-6 space-y-3">
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  Número de orden
                </p>
                <p className="mt-1 font-heading text-lg font-medium text-primary break-all">
                  {orderId}
                </p>
              </div>

              {paymentMethod && (
                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    Método de pago
                  </p>
                  <p className="mt-1 font-body text-base text-on-surface">
                    {PaymentMethodLabel(paymentMethod)}
                  </p>
                </div>
              )}

              {order && (
                <div className="rounded-lg bg-surface-container-low p-4">
                  <p className="font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    Total
                  </p>
                  <p className="mt-1 font-heading text-lg font-medium text-primary">
                    {formatPrice(order.total)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {status === 'failure' ? (
              <Link href="/carrito" className="btn-primary">
                Volver al carrito
              </Link>
            ) : (
              <Link href="/" className="btn-primary">
                Volver al inicio
              </Link>
            )}
            <Link href="/fundas" className="btn-secondary">
              Seguir comprando
            </Link>
          </div>
        </div>

        {status === 'failure' && (
          <div className="mt-6 rounded-xl border border-outline-variant/50 bg-surface-container-low p-5">
            <h2 className="font-heading text-base font-medium text-on-surface">
              ¿Problemas con tu pago?
            </h2>
            <ul className="mt-3 flex flex-col gap-2 font-body text-sm text-on-surface-variant">
              <li>• Verifica que los datos de tu tarjeta sean correctos.</li>
              <li>• Asegúrate de tener fondos suficientes.</li>
              <li>• Si pagas con PSE, confirma que tu banco esté disponible.</li>
              <li>
                • Si el problema persiste,{' '}
                <Link href="/contacto" className="text-primary underline">
                  contáctanos
                </Link>
                .
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdenPage() {
  return (
    <Suspense
      fallback={
        <div className="container-store py-12 text-center">
          <div className="mx-auto h-12 w-48 animate-pulse rounded-lg bg-surface-container-high" />
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}
