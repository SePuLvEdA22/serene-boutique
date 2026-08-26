import { describe, it, expect } from 'vitest';
import { validateCoupon } from '@/lib/promos';
import type { Promo } from '@/lib/models/promo';

/**
 * Validación autoritativa de cupones: activo, no vencido, límite de usos,
 * mínimo de compra y cálculo del descuento (porcentaje con redondeo y fijo
 * acotado al subtotal).
 */

function makePromo(overrides: Partial<Promo> = {}): Promo {
  return {
    id: 'promo-1',
    code: 'BIENVENIDA10',
    type: 'percent',
    value: 10,
    minOrder: 0,
    active: true,
    usedCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const NOW = new Date('2026-08-25T12:00:00.000Z');

describe('validateCoupon', () => {
  it('calcula_descuento_porcentual_con_redondeo', () => {
    const result = validateCoupon(makePromo({ value: 15 }), 99990, NOW);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(14999); // round(99990 * 0.15)
  });

  it('cupón_fijo_no_supera_el_subtotal', () => {
    const result = validateCoupon(makePromo({ type: 'fixed', value: 50000 }), 30000, NOW);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(30000);
  });

  it('rechaza_cupón_inactivo', () => {
    const result = validateCoupon(makePromo({ active: false }), 100000, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/no está activo/);
  });

  it('rechaza_cupón_vencido', () => {
    const result = validateCoupon(
      makePromo({ expiresAt: '2026-08-01T00:00:00.000Z' }),
      100000,
      NOW
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/vencido/);
  });

  it('acepta_cupón_que_vence_exactamente_hoy_(aún_no_vencido)', () => {
    // expiresAt < now estricto: mismo instante NO está vencido
    const result = validateCoupon(
      makePromo({ expiresAt: '2026-08-26T00:00:00.000Z' }),
      100000,
      NOW
    );
    expect(result.valid).toBe(true);
  });

  it('rechaza_al_alcanzar_el_límite_de_usos', () => {
    const result = validateCoupon(
      makePromo({ usageLimit: 5, usedCount: 5 }),
      100000,
      NOW
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/límite de usos/);
  });

  it('acepta_bajo_el_límite_de_usos', () => {
    const result = validateCoupon(
      makePromo({ usageLimit: 5, usedCount: 4 }),
      100000,
      NOW
    );
    expect(result.valid).toBe(true);
  });

  it('rechaza_compra_menor_al_mínimo', () => {
    const result = validateCoupon(makePromo({ minOrder: 200000 }), 150000, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Compra mínima/);
  });

  it('rechaza_cupón_inexistente', () => {
    const result = validateCoupon(undefined, 100000, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/no existe/);
  });
});
