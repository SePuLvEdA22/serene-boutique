import { describe, it, expect } from 'vitest';
import { formatPrice, getPrice } from '@/lib/format-price';

describe('formatPrice', () => {
  it('formats integer prices correctly', () => {
    expect(formatPrice(249)).toBe('249 COP');
  });

  it('rounds decimal prices to integer pesos', () => {
    expect(formatPrice(249.49)).toBe('249 COP');
    expect(formatPrice(249.50)).toBe('250 COP');
  });

  it('formats large prices with thousands separator', () => {
    expect(formatPrice(1299)).toBe('1.299 COP');
    expect(formatPrice(450000)).toBe('450.000 COP');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('0 COP');
  });

  it('always shows integer pesos without decimals', () => {
    expect(formatPrice(100)).toBe('100 COP');
  });
});

describe('getPrice', () => {
  it('debería_devolver_el_precio_base_sin_precio_de_oferta', () => {
    expect(getPrice({ price: 249000 })).toBe(249000);
    expect(getPrice({ price: 249000, salePrice: undefined })).toBe(249000);
  });

  it('debería_usar_el_precio_de_oferta_cuando_es_menor', () => {
    expect(getPrice({ price: 249000, salePrice: 199000 })).toBe(199000);
  });

  it('debería_ignorar_la_oferta_cuando_no_es_menor_que_el_precio', () => {
    expect(getPrice({ price: 249000, salePrice: 249000 })).toBe(249000);
    expect(getPrice({ price: 249000, salePrice: 299000 })).toBe(249000);
  });
});
