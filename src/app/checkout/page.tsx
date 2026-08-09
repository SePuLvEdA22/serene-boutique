'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice, getPrice } from '@/lib/format-price';
import Spinner from '@/components/Spinner';
import { shippingSchema, formatZodErrors } from '@/lib/validation';
import {
  PAYMENT_METHODS,
  COL_IDENTIFICATION_TYPES,
  isTestMode,
  getTestMessage,
  type PaymentMethodType,
  type ColIdentificationType,
} from '@/lib/mercadopago';

type Step = 'shipping' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  // Estado del método de pago
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');

  // Estado para PSE (identificación Colombia)
  const [docType, setDocType] = useState<ColIdentificationType>('CC');
  const [docNumber, setDocNumber] = useState('');

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
    setErrors({});

    const result = shippingSchema.safeParse(shipping);
    if (!result.success) {
      setErrors(formatZodErrors(result.error.issues));
      return;
    }

    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Valida los datos de PSE (identificación) antes de enviar.
   */
  const validatePse = (): boolean => {
    if (!docNumber || docNumber.length < 4) {
      setErrors({ docNumber: 'El número de documento debe tener al menos 4 caracteres' });
      return false;
    }
    return true;
  };

  /**
   * Procesa el pago: crea preferencia en MercadoPago y redirige al Checkout Pro.
   */
  const handlePayment = async () => {
    setLoading(true);
    setErrors({});
    setError('');

    // Validar PSE
    if (paymentMethod === 'pse' && !validatePse()) {
      setLoading(false);
      return;
    }

    try {
      // Construir payload para la preferencia
      const payload: Record<string, unknown> = {
        items: items.map((i) => ({
          id: i.product.id,
          title: i.product.name,
          quantity: i.quantity,
          unit_price: getPrice(i.product),
        })),
        paymentMethod,
        shipping: {
          name: shipping.name,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.zip,
          notes: shipping.notes || '',
        },
      };

      // Si es PSE, incluir datos de identificación del pagador
      if (paymentMethod === 'pse') {
        payload.payer = {
          name: shipping.name,
          email: shipping.email,
          identification: {
            type: docType,
            number: docNumber,
          },
        };
      }

      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la preferencia de pago');
      }

      // En modo test, redirigir directamente a la orden
      if (data.testMode) {
        clearCart();
        setStep('confirm');
        router.push(`/orden?id=${data.orderId}&status=success`);
        return;
      }

      // Redirigir al Checkout Pro de MercadoPago
      const initPoint = data.preference?.init_point || data.preference?.sandbox_init_point;

      if (initPoint) {
        // Guardar referencia para cuando vuelva de MP
        sessionStorage.setItem('mp-order-id', data.orderId);
        sessionStorage.setItem('mp-payment-method', paymentMethod);
        window.location.href = initPoint;
      } else {
        throw new Error('No se recibió la URL de pago');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago. Intenta de nuevo.');
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
            <form onSubmit={handleShippingSubmit} className="flex flex-col gap-5" noValidate>
              <h2 className="font-heading text-2xl font-medium text-on-surface">
                Información de envío
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="s-name"
                    className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                  >
                    Nombre completo *
                  </label>
                  <input
                    id="s-name"
                    value={shipping.name}
                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                    className={`input-field ${errors.name ? 'border-error' : ''}`}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 font-body text-xs text-error" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="s-email"
                    className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                  >
                    Email *
                  </label>
                  <input
                    id="s-email"
                    type="email"
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                    className={`input-field ${errors.email ? 'border-error' : ''}`}
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 font-body text-xs text-error" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="s-phone"
                  className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                >
                  Teléfono *
                </label>
                <input
                  id="s-phone"
                  type="tel"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  className={`input-field ${errors.phone ? 'border-error' : ''}`}
                  required
                />
                {errors.phone && (
                  <p className="mt-1 font-body text-xs text-error" role="alert">
                    {errors.phone}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="s-address"
                  className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                >
                  Dirección *
                </label>
                <input
                  id="s-address"
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  className={`input-field ${errors.address ? 'border-error' : ''}`}
                  required
                />
                {errors.address && (
                  <p className="mt-1 font-body text-xs text-error" role="alert">
                    {errors.address}
                  </p>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="s-city"
                    className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                  >
                    Ciudad *
                  </label>
                  <input
                    id="s-city"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className={`input-field ${errors.city ? 'border-error' : ''}`}
                    required
                  />
                  {errors.city && (
                    <p className="mt-1 font-body text-xs text-error" role="alert">
                      {errors.city}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="s-state"
                    className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                  >
                    Estado/Depto *
                  </label>
                  <input
                    id="s-state"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    className={`input-field ${errors.state ? 'border-error' : ''}`}
                    required
                  />
                  {errors.state && (
                    <p className="mt-1 font-body text-xs text-error" role="alert">
                      {errors.state}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="s-zip"
                    className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                  >
                    Código Postal *
                  </label>
                  <input
                    id="s-zip"
                    value={shipping.zip}
                    onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                    className={`input-field ${errors.zip ? 'border-error' : ''}`}
                    required
                  />
                  {errors.zip && (
                    <p className="mt-1 font-body text-xs text-error" role="alert">
                      {errors.zip}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="s-notes"
                  className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                >
                  Notas (opcional)
                </label>
                <textarea
                  id="s-notes"
                  rows={3}
                  value={shipping.notes}
                  onChange={(e) => setShipping({ ...shipping, notes: e.target.value })}
                  className="input-field resize-none"
                />
              </div>
              <button type="submit" className="btn-primary">
                Continuar al pago
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div className="flex flex-col gap-6">
              <h2 className="font-heading text-2xl font-medium text-on-surface">
                Método de pago
              </h2>

              {/* Selector de método de pago */}
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                      paymentMethod === method.value
                        ? 'border-primary bg-primary-container/20'
                        : 'border-outline-variant bg-surface-container-low hover:border-primary/50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        paymentMethod === method.value
                          ? 'border-primary'
                          : 'border-outline'
                      }`}
                    >
                      {paymentMethod === method.value && (
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-on-surface">
                        {method.label}
                      </p>
                      <p className="mt-0.5 font-body text-sm text-on-surface-variant">
                        {method.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Test mode notice */}
              {isTestMode && (
                <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
                  <p className="font-body text-sm text-yellow-800 leading-relaxed whitespace-pre-line">
                    {getTestMessage(paymentMethod)}
                  </p>
                </div>
              )}

              {/* Formulario PSE: identificación */}
              {paymentMethod === 'pse' && (
                <div className="rounded-xl bg-surface-container p-5">
                  <h3 className="mb-4 font-heading text-lg font-medium text-on-surface">
                    Identificación del pagador (Colombia)
                  </h3>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="doc-type"
                        className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                      >
                        Tipo de documento *
                      </label>
                      <select
                        id="doc-type"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as ColIdentificationType)}
                        className="input-field"
                        required
                      >
                        {COL_IDENTIFICATION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="doc-number"
                        className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant"
                      >
                        Número de documento *
                      </label>
                      <input
                        id="doc-number"
                        value={docNumber}
                        onChange={(e) => {
                          setDocNumber(e.target.value);
                          if (errors.docNumber) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.docNumber;
                              return next;
                            });
                          }
                        }}
                        placeholder="1234567890"
                        className={`input-field ${errors.docNumber ? 'border-error' : ''}`}
                        required
                      />
                      {errors.docNumber && (
                        <p className="mt-1 font-body text-xs text-error" role="alert">
                          {errors.docNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-surface-container-low p-3">
                    <p className="font-body text-xs text-on-surface-variant">
                      💡 PSE redirigirá a la página de tu banco para autorizar el pago de forma
                      segura. Una vez completado, volverás a nuestra tienda.
                    </p>
                  </div>
                </div>
              )}

              {/* Legacy: formulario de tarjeta (solo en test mode sin MP SDK) */}
              {paymentMethod === 'card' && (
                <div className="rounded-xl bg-surface-container p-5">
                  <h3 className="mb-4 font-heading text-lg font-medium text-on-surface">
                    Información de tarjeta
                  </h3>
                  <p className="mb-4 font-body text-sm text-on-surface-variant">
                    Serás redirigido a MercadoPago Checkout Pro para ingresar los datos de tu
                    tarjeta de forma segura.
                  </p>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="font-body text-xs text-on-surface-variant">
                      🔒 Tus datos de pago se procesan directamente en MercadoPago, plataforma
                      certificada PCI-DSS. Nosotros no almacenamos información de tarjetas.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <p className="font-body text-sm text-error" role="alert">
                  {error}
                </p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="btn-secondary"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handlePayment}
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> Conectando con MercadoPago...
                    </span>
                  ) : paymentMethod === 'pse' ? (
                    `Pagar con PSE — ${formatPrice(totalPrice)}`
                  ) : (
                    `Pagar ${formatPrice(totalPrice)}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-surface-container p-6">
            <h2 className="font-heading text-xl font-medium text-on-surface">
              Resumen del pedido
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}`}
                  className="flex justify-between font-body text-sm"
                >
                  <span className="text-on-surface-variant">
                    {item.product.name} x{item.quantity}
                    {item.selectedColor ? ` (${item.selectedColor})` : ''}
                  </span>
                  <span className="text-on-surface">
                    {formatPrice(getPrice(item.product) * item.quantity)}
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
                <span className="text-on-surface">
                  {paymentMethod === 'pse' ? 'Gratis' : 'Calculado al pagar'}
                </span>
              </div>
              <div className="mt-3 border-t border-outline-variant/50 pt-3 flex justify-between">
                <span className="font-body text-base font-medium text-on-surface">Total</span>
                <span className="font-heading text-xl font-medium text-primary">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-surface-container-low p-3">
              <p className="font-body text-xs text-on-surface-variant">
                💳 Todos los pagos se procesan en{' '}
                <strong className="text-on-surface">COP (Peso Colombiano)</strong>
                {paymentMethod === 'pse'
                  ? ' a través de PSE.'
                  : ' con tarjeta de crédito o débito.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
