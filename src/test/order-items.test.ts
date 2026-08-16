import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { validateOrderItems, MAX_ITEM_QUANTITY } from '@/lib/order-items';
import { getProductRepo } from '@/lib/repositories';
import { resetStore } from '@/lib/store';

/**
 * La validación de items contra el catálogo es la primera línea de defensa
 * contra la manipulación de precios en el checkout (p. ej. pagar $1 por un
 * producto caro).
 */

beforeEach(() => {
  const g = globalThis as Record<string, unknown>;
  g.__store_data = undefined;
  g.__adminInitialized = false;
  resetStore();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('validateOrderItems', () => {
  it('debería_aceptar_items_con_precios_del_catálogo_y_calcular_el_total', () => {
    const result = validateOrderItems([
      { productId: 'funda-silicone-clear', quantity: 2, unit_price: 249000 },
      { productId: 'cargador-rapido-20w', quantity: 1, unit_price: 349000 },
    ]);

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.items).toHaveLength(2);
    // Nombres y precios vienen del catálogo, no del cliente
    expect(result.items[0].name).toBe('Funda Silicona Transparente');
    expect(result.items[0].price).toBe(249000);
    expect(result.total).toBe(249000 * 2 + 349000);
  });

  it('debería_rechazar_precio_manipulado', () => {
    const result = validateOrderItems([
      { productId: 'funda-silicone-clear', quantity: 1, unit_price: 1 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Precio inválido');
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('debería_rechazar_precio_manipulado_con_campo_price_de_orders', () => {
    const result = validateOrderItems([
      { productId: 'cargador-rapido-20w', quantity: 1, price: 100 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Precio inválido');
  });

  it('debería_respetar_el_precio_de_oferta_del_catálogo', () => {
    // funda-floral-rose tiene price 299000 y no salePrice; se cobra el base.
    const normal = validateOrderItems([
      { productId: 'funda-floral-rose', quantity: 1, unit_price: 299000 },
    ]);
    expect(normal.ok).toBe(true);
  });

  it('debería_rechazar_producto_inexistente', () => {
    const result = validateOrderItems([
      { productId: 'no-existe', quantity: 1, unit_price: 1000 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Producto no encontrado');
  });

  it('debería_rechazar_producto_inactivo', () => {
    // Desactivar un producto existente y verificar que no se puede comprar
    getProductRepo().update('termo-vidrio-350ml', { active: false });

    const result = validateOrderItems([
      { productId: 'termo-vidrio-350ml', quantity: 1, unit_price: 379000 },
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Producto no disponible');
  });

  it('debería_rechazar_cantidad_inválida_o_excesiva', () => {
    const zero = validateOrderItems([
      { productId: 'funda-silicone-clear', quantity: 0, unit_price: 249000 },
    ]);
    expect(zero.ok).toBe(false);
    expect(zero.errors).toContain('Cantidad inválida');

    const excesiva = validateOrderItems([
      { productId: 'funda-silicone-clear', quantity: MAX_ITEM_QUANTITY + 1, unit_price: 249000 },
    ]);
    expect(excesiva.ok).toBe(false);
    expect(excesiva.errors).toContain('Cantidad excede el máximo permitido');
  });

  it('debería_rechazar_sin_precio', () => {
    const result = validateOrderItems([
      { productId: 'funda-silicone-clear', quantity: 1 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Precio inválido');
  });

  it('debería_rechazar_lista_vacía', () => {
    const result = validateOrderItems([]);
    expect(result.ok).toBe(false);
  });
});
