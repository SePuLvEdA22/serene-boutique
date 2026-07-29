export type Currency = 'MXN' | 'COP';

export function formatPrice(price: number, currency: Currency = 'MXN'): string {
  return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}
