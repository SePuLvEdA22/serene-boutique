import { describe, it, expect } from 'vitest';
import { formatPrice } from '@/lib/format-price';

describe('formatPrice', () => {
  it('formats integer prices correctly', () => {
    expect(formatPrice(249)).toBe('$249');
  });

  it('rounds decimal prices to integer pesos', () => {
    expect(formatPrice(249.49)).toBe('$249');
    expect(formatPrice(249.50)).toBe('$250');
  });

  it('formats large prices with thousands separator', () => {
    expect(formatPrice(1299)).toBe('$1.299');
    expect(formatPrice(459000)).toBe('$459.000');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('$0');
  });

  it('always shows integer pesos without decimals', () => {
    expect(formatPrice(100)).toBe('$100');
  });
});
