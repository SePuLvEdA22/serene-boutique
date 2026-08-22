'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { getPrice } from '@/lib/format-price';
import CheckoutStepper from './_components/CheckoutStepper';
import ShippingStep, { EMPTY_SHIPPING, type ShippingForm } from './_components/ShippingStep';
import PaymentStep from './_components/PaymentStep';
import OrderSummary, { type AppliedCoupon } from './_components/OrderSummary';
import type { PaymentMethodType, ColIdentificationType } from '@/lib/mercadopago';

type Step = 'shipping' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);

  // Estado del método de pago
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('card');

  // Estado para PSE (identificación Colombia)
  const [docType, setDocType] = useState<ColIdentificationType>('CC');
  const [docNumber, setDocNumber] = useState('');

  // Estado del cupón de descuento
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const discountedTotal = Math.max(0, totalPrice - (coupon?.discount ?? 0));

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

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: totalPrice }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCoupon(null);
        setCouponError(data.error || 'Cupón inválido');
        return;
      }
      setCoupon({ code, discount: data.discount });
    } catch {
      setCouponError('No se pudo validar el cupón');
    } finally {
      setCouponLoading(false);
    }
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
        ...(coupon ? { couponCode: coupon.code } : {}),
        shipping,
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
      <CheckoutStepper step={step} />

      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {step === 'shipping' && (
            <ShippingStep
              shipping={shipping}
              onShippingChange={setShipping}
              errors={errors}
              onErrorsChange={setErrors}
              onSubmit={() => {
                setStep('payment');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {step === 'payment' && (
            <PaymentStep
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              docType={docType}
              onDocTypeChange={setDocType}
              docNumber={docNumber}
              onDocNumberChange={setDocNumber}
              errors={errors}
              onDocNumberErrorClear={() =>
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.docNumber;
                  return next;
                })
              }
              error={error}
              loading={loading}
              discountedTotal={discountedTotal}
              onBack={() => setStep('shipping')}
              onPay={handlePayment}
            />
          )}
        </div>

        <div className="lg:col-span-2">
          <OrderSummary
            items={items}
            totalPrice={totalPrice}
            discountedTotal={discountedTotal}
            paymentMethod={paymentMethod}
            coupon={coupon}
            onCouponRemove={() => {
              setCoupon(null);
              setCouponCode('');
            }}
            couponCode={couponCode}
            onCouponCodeChange={setCouponCode}
            couponError={couponError}
            couponLoading={couponLoading}
            onCouponApply={applyCoupon}
          />
        </div>
      </div>
    </div>
  );
}
