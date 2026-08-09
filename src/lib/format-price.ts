/**
 * Formatea un precio en pesos colombianos con el formato estándar del retail
 * colombiano: `$459.000` — sin decimales y con punto como separador de miles.
 *
 * Se implementa de forma determinista (sin `Intl` para la moneda) porque la
 * salida de `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`
 * varía entre entornos: Node produce `$459,00` (coma decimal) mientras que
 * navegadores producen `$459.00` (punto decimal), que se confunde con dólares.
 */
export function formatPrice(price: number): string {
  return `$${formatThousands(Math.round(price))}`;
}

/** 459000 → "459.000"; 1299 → "1.299"; 0 → "0" */
function formatThousands(value: number): string {
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(value));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
