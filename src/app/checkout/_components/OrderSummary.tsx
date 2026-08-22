'use client';

import { formatPrice, getPrice } from '@/lib/format-price';
import type { CartItem } from '@/types/cart';

export interface AppliedCoupon {
  code: string;
  discount: number;
}

interface OrderSummaryProps {
  items: CartItem[];
  totalPrice: number;
  discountedTotal: number;
  paymentMethod: 'card' | 'pse';
  coupon: AppliedCoupon | null;
  onCouponRemove: () => void;
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  couponError: string;
  couponLoading: boolean;
  onCouponApply: () => void;
}

export default function OrderSummary({
  items,
  totalPrice,
  discountedTotal,
  paymentMethod,
  coupon,
  onCouponRemove,
  couponCode,
  onCouponCodeChange,
  couponError,
  couponLoading,
  onCouponApply,
}: OrderSummaryProps) {
  return (
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
        {/* Cupón de descuento */}
        <div className="mb-4">
          <label htmlFor="coupon-code" className="mb-2 block font-body text-sm font-medium uppercase tracking-wider text-on-surface-variant">
            Cupón de descuento
          </label>
          {coupon ? (
            <div className="flex items-center justify-between rounded-lg bg-primary-container/30 p-3">
              <p className="font-body text-sm text-on-surface">
                <span className="chip bg-primary-container text-on-primary-container text-[11px] mr-2">{coupon.code}</span>
                -{formatPrice(coupon.discount)}
              </p>
              <button
                type="button"
                onClick={onCouponRemove}
                className="font-body text-xs text-on-surface-variant underline hover:text-error"
              >
                Quitar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                id="coupon-code"
                value={couponCode}
                onChange={(e) => onCouponCodeChange(e.target.value)}
                placeholder="EJ: BIENVENIDO10"
                className="input-field flex-1 uppercase"
                maxLength={30}
              />
              <button
                type="button"
                onClick={onCouponApply}
                disabled={couponLoading || !couponCode.trim()}
                className="rounded-lg bg-secondary px-3 py-2 font-body text-sm text-on-secondary transition-colors hover:opacity-90 disabled:opacity-40"
              >
                {couponLoading ? 'Validando...' : 'Aplicar'}
              </button>
            </div>
          )}
          {couponError && (
            <p className="mt-2 font-body text-xs text-error" role="alert">{couponError}</p>
          )}
        </div>

        <div className="flex justify-between font-body text-sm">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="text-on-surface">{formatPrice(totalPrice)}</span>
        </div>
        {coupon && (
          <div className="mt-2 flex justify-between font-body text-sm">
            <span className="text-on-surface-variant">Descuento ({coupon.code})</span>
            <span className="text-green-600">-{formatPrice(coupon.discount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between font-body text-sm">
          <span className="text-on-surface-variant">Envío</span>
          <span className="text-on-surface">
            {paymentMethod === 'pse' ? 'Gratis' : 'Calculado al pagar'}
          </span>
        </div>
        <div className="mt-3 border-t border-outline-variant/50 pt-3 flex justify-between">
          <span className="font-body text-base font-medium text-on-surface">Total</span>
          <span className="font-heading text-xl font-medium text-primary">
            {formatPrice(discountedTotal)}
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
  );
}
