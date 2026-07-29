import { describe, it, expect } from 'vitest';
import { formatPrice } from '@/lib/format-price';

describe('formatPrice', () => {
  it('formats integer prices correctly', () => {
    const result = formatPrice(249);
    expect(result).toContain('249');
    expect(result).toMatch(/[\d,]+\.\d{2}/);
  });

  it('formats decimal prices correctly', () => {
    const result = formatPrice(249.50);
    expect(result).toContain('249');
    expect(result).toContain('50');
    expect(result).toMatch(/[\d,]+\.\d{2}/);
  });

  it('formats large prices with thousands separator', () => {
    const result = formatPrice(1299);
    expect(result).toContain('1');
    expect(result).toMatch(/[\d,]+\d{3}\.\d{2}/);
  });

  it('formats zero correctly', () => {
    const result = formatPrice(0);
    expect(result).toMatch(/0\.00/);
  });

  it('always shows two decimal places', () => {
    const result = formatPrice(100);
    expect(result).toMatch(/[\d,]+\.00/);
  });
});
