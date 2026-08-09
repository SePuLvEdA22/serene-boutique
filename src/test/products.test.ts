import { describe, it, expect } from 'vitest';
import { formatPrice } from '@/lib/format-price';

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
