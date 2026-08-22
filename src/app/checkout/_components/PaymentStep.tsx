'use client';

import Spinner from '@/components/Spinner';
import { formatPrice } from '@/lib/format-price';
import {
  PAYMENT_METHODS,
  COL_IDENTIFICATION_TYPES,
  isTestMode,
  getTestMessage,
  type PaymentMethodType,
  type ColIdentificationType,
} from '@/lib/mercadopago';

interface PaymentStepProps {
  paymentMethod: PaymentMethodType;
  onPaymentMethodChange: (method: PaymentMethodType) => void;
  docType: ColIdentificationType;
  onDocTypeChange: (type: ColIdentificationType) => void;
  docNumber: string;
  onDocNumberChange: (number: string) => void;
  errors: Record<string, string>;
  onDocNumberErrorClear: () => void;
  error: string;
  loading: boolean;
  discountedTotal: number;
  onBack: () => void;
  onPay: () => void;
}

export default function PaymentStep({
  paymentMethod,
  onPaymentMethodChange,
  docType,
  onDocTypeChange,
  docNumber,
  onDocNumberChange,
  errors,
  onDocNumberErrorClear,
  error,
  loading,
  discountedTotal,
  onBack,
  onPay,
}: PaymentStepProps) {
  return (
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
            onClick={() => onPaymentMethodChange(method.value)}
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
                onChange={(e) => onDocTypeChange(e.target.value as ColIdentificationType)}
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
                  onDocNumberChange(e.target.value);
                  if (errors.docNumber) {
                    onDocNumberErrorClear();
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
        <button type="button" onClick={onBack} className="btn-secondary">
          Volver
        </button>
        <button type="button" onClick={onPay} className="btn-primary flex-1" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner /> Conectando con MercadoPago...
            </span>
          ) : paymentMethod === 'pse' ? (
            `Pagar con PSE — ${formatPrice(discountedTotal)}`
          ) : (
            `Pagar ${formatPrice(discountedTotal)}`
          )}
        </button>
      </div>
    </div>
  );
}
