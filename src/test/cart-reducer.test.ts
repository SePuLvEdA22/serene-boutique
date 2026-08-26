import { describe, it, expect } from 'vitest';
import { cartReducer } from '@/context/CartContext';
import type { Product } from '@/types';

/**
 * Lógica pura del carrito (dinero): agregar/sumar por producto+color,
 * eliminar, actualizar cantidad (0 elimina), vaciar y abrir/cerrar drawer.
 */

const FUNDA: Product = {
  id: 'funda-1',
  name: 'Funda Test',
  description: '',
  price: 50000,
  category: 'fundas',
  images: [],
  featured: false,
  active: true,
  colors: ['Negro'],
} as unknown as Product;

const CARGADOR: Product = {
  ...FUNDA,
  id: 'cargador-1',
  name: 'Cargador Test',
  price: 80000,
  salePrice: 70000,
} as unknown as Product;

type State = Parameters<typeof cartReducer>[0];
const initial: State = { items: [], isOpen: false };

describe('cartReducer — ADD_ITEM', () => {
  it('agrega_un_producto_nuevo', () => {
    const state = cartReducer(initial, {
      type: 'ADD_ITEM',
      payload: { product: FUNDA, quantity: 2 },
    });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('suma_cantidad_si_el_producto_y_color_ya_están', () => {
    let state = cartReducer(initial, {
      type: 'ADD_ITEM',
      payload: { product: FUNDA, quantity: 1, selectedColor: 'Negro' },
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { product: FUNDA, quantity: 3, selectedColor: 'Negro' },
    });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(4);
  });

  it('mismo_producto_con_distinto_color_son_items_separados', () => {
    let state = cartReducer(initial, {
      type: 'ADD_ITEM',
      payload: { product: FUNDA, quantity: 1, selectedColor: 'Negro' },
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { product: FUNDA, quantity: 1, selectedColor: 'Blanco' },
    });
    expect(state.items).toHaveLength(2);
  });

  it('usa_cantidad_1_por_defecto', () => {
    const state = cartReducer(initial, { type: 'ADD_ITEM', payload: { product: FUNDA } });
    expect(state.items[0].quantity).toBe(1);
  });
});

describe('cartReducer — REMOVE_ITEM / UPDATE_QUANTITY', () => {
  const seeded = (): State =>
    cartReducer(initial, {
      type: 'ADD_ITEM',
      payload: { product: FUNDA, quantity: 2, selectedColor: 'Negro' },
    });

  it('elimina_solo_el_item_con_ese_producto_y_color', () => {
    const state = cartReducer(seeded(), {
      type: 'REMOVE_ITEM',
      payload: { productId: 'funda-1', selectedColor: 'Blanco' },
    });
    expect(state.items).toHaveLength(1);
  });

  it('cantidad_0_o_negativa_elimina_el_item', () => {
    let state = cartReducer(seeded(), {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 'funda-1', quantity: 0, selectedColor: 'Negro' },
    });
    expect(state.items).toHaveLength(0);

    state = cartReducer(seeded(), {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 'funda-1', quantity: -1, selectedColor: 'Negro' },
    });
    expect(state.items).toHaveLength(0);
  });

  it('actualiza_la_cantidad_de_forma_absoluta', () => {
    const state = cartReducer(seeded(), {
      type: 'UPDATE_QUANTITY',
      payload: { productId: 'funda-1', quantity: 7, selectedColor: 'Negro' },
    });
    expect(state.items[0].quantity).toBe(7);
  });
});

describe('cartReducer — CLEAR / TOGGLE / HYDRATE', () => {
  it('CLEAR_CART_vacía_sin_perder_isOpen', () => {
    let state: State = cartReducer(initial, { type: 'ADD_ITEM', payload: { product: FUNDA } });
    state = cartReducer({ ...state, isOpen: true }, { type: 'CLEAR_CART' });
    expect(state.items).toEqual([]);
    expect(state.isOpen).toBe(true);
  });

  it('TOGGLE_CART_alterna_el_drawer', () => {
    const open = cartReducer(initial, { type: 'TOGGLE_CART' });
    expect(open.isOpen).toBe(true);
    expect(cartReducer(open, { type: 'TOGGLE_CART' }).isOpen).toBe(false);
  });

  it('HYDRATE_reemplaza_los_items_(restauración_desde_localStorage)', () => {
    const items = [{ product: CARGADOR, quantity: 2, selectedColor: undefined }];
    const state = cartReducer(initial, { type: 'HYDRATE', payload: items as never });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product.id).toBe('cargador-1');
  });
});
