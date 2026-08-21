import type { Promo } from '@/lib/models/promo';

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  promo?: Promo;
  /** Descuento en COP (entero). */
  discount?: number;
}

/**
 * Valida un cupón contra una compra: activo, no vencido, dentro del límite de
 * usos y sobre el mínimo de compra. Devuelve el descuento calculado.
 */
export function validateCoupon(
  promo: Promo | undefined,
  subtotal: number,
  now: Date = new Date()
): CouponValidation {
  if (!promo) return { valid: false, reason: 'El código no existe' };
  if (!promo.active) return { valid: false, reason: 'Este cupón no está activo' };
  if (promo.expiresAt && new Date(promo.expiresAt).getTime() < now.getTime()) {
    return { valid: false, reason: 'Este cupón ha vencido' };
  }
  if (promo.usageLimit !== undefined && (promo.usedCount ?? 0) >= promo.usageLimit) {
    return { valid: false, reason: 'Este cupón alcanzó su límite de usos' };
  }
  if (subtotal < promo.minOrder) {
    return { valid: false, reason: `Compra mínima de ${promo.minOrder}` };
  }

  const discount =
    promo.type === 'percent'
      ? Math.round(subtotal * (promo.value / 100))
      : Math.min(promo.value, subtotal);

  return { valid: true, promo, discount };
}