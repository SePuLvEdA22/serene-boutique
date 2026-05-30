'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/products';

type Step = 'shipping' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shipping, setShipping] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  });

  const [cardInfo, setCardInfo] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });

  if (items.length === 0 && step !== 'confirm') {
    return (
      <div className="container-store py-12">
        <div className="mx-auto max-w-lg rounded-2xl bg-surface-container p-8 text-center">
          <h1 className="font-heading text-2xl font-medium text-on-surface">Carrito vacío</h1>
          <p className="mt-2 font-body text-base text-on-surface-variant">
            Agrega productos al carrito antes de continuar.
          </p>
          <Link href="/fundas" className="btn-primary mt-6 inline-block">
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  const handleShippingSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
            color: i.selectedColor,
          })),
          shipping,
          total: totalPrice,
        }),
      });

      if (!res.ok) throw new Error('Error al crear la orden');

      const data = await res.json();
      clearCart();
      setStep('confirm');
      router.push(`/orden?id=${data.order.id}`);
    } catch {
      setError('Error al procesar el pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-store py-12 animate-fade-in">
      <div className="mb-8 flex items-center gap-3">
        {(['shipping', 'payment', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? 'bg-primary text-on-primary'
                  : ['shipping', 'payment'].indexOf(step) >= i
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden sm:inline font-body text-sm ${
                step === s ? 'text-on-surface font-medium' : 'text-on-surface-variant'
              }`}
            >
              {s === 'shipping' ? 'Envío' : s === 'payment' ? 'Pago' : 'Confirmación'}
            </span>
            {i < 2 && <div className="h-px w-8 bg-outline-variant hidden sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {step === 'shipping' && (
            <form onSubmit={handleShippingSubmit} className="flex flex-col gap-5">
              <h2 className="font-heading text-2xl font-medium text-on-surface">Información de envío</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-name" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Nombre completo *
                  </label>
                  <input id="s-name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label htmlFor="s-email" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Email *
                  </label>
                  <input id="s-email" type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label htmlFor="s-phone" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Teléfono *
                </label>
                <input id="s-phone" type="tel" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label htmlFor="s-address" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Dirección *
                </label>
                <input id="s-address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} className="input-field" required />
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="s-city" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Ciudad *
                  </label>
                  <input id="s-city" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label htmlFor="s-state" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Estado *
                  </label>
                  <input id="s-state" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label htmlFor="s-zip" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    CP *
                  </label>
                  <input id="s-zip" value={shipping.zip} onChange={(e) => setShipping({ ...shipping, zip: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label htmlFor="s-notes" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Notas (opcional)
                </label>
                <textarea id="s-notes" rows={3} value={shipping.notes} onChange={(e) => setShipping({ ...shipping, notes: e.target.value })} className="input-field resize-none" />
              </div>
              <button type="submit" className="btn-primary">
                Continuar al pago
              </button>
            </form>
          )}

          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-5">
              <h2 className="font-heading text-2xl font-medium text-on-surface">Información de pago</h2>
              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                <p className="font-body text-sm text-on-surface-variant">
                  Este es un entorno de prueba. No se realizarán cargos reales.
                </p>
              </div>
              <div>
                <label htmlFor="card-number" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Número de tarjeta
                </label>
                <input id="card-number" value={cardInfo.number} onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })} placeholder="4242 4242 4242 4242" className="input-field" required />
              </div>
              <div>
                <label htmlFor="card-name" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Nombre en la tarjeta
                </label>
                <input id="card-name" value={cardInfo.name} onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })} className="input-field" required />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="card-expiry" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Vencimiento
                  </label>
                  <input id="card-expiry" value={cardInfo.expiry} onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })} placeholder="MM/AA" className="input-field" required />
                </div>
                <div>
                  <label htmlFor="card-cvc" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    CVC
                  </label>
                  <input id="card-cvc" value={cardInfo.cvc} onChange={(e) => setCardInfo({ ...cardInfo, cvc: e.target.value })} placeholder="123" className="input-field" required />
                </div>
              </div>
              {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}
              <div className="flex gap-4">
                <button type="button" onClick={() => setStep('shipping')} className="btn-secondary">
                  Volver
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Procesando...' : `Pagar ${formatPrice(totalPrice)}`}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-surface-container p-6">
            <h2 className="font-heading text-xl font-medium text-on-surface">Resumen del pedido</h2>
            <div className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedColor}`} className="flex justify-between font-body text-sm">
                  <span className="text-on-surface-variant">
                    {item.product.name} x{item.quantity}
                    {item.selectedColor ? ` (${item.selectedColor})` : ''}
                  </span>
                  <span className="text-on-surface">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-outline-variant/50 pt-3">
              <div className="flex justify-between font-body text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface">{formatPrice(totalPrice)}</span>
              </div>
              <div className="mt-2 flex justify-between font-body text-sm">
                <span className="text-on-surface-variant">Envío</span>
                <span className="text-on-surface">Gratis</span>
              </div>
              <div className="mt-3 border-t border-outline-variant/50 pt-3 flex justify-between">
                <span className="font-body text-base font-medium text-on-surface">Total</span>
                <span className="font-heading text-xl font-medium text-primary">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
