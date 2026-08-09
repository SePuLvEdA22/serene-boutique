import { formatPrice, getPrice } from '@/lib/format-price';

interface PriceTagProps {
  product: { price: number; salePrice?: number };
  /** Clases del <p> contenedor (posición/estilo). */
  className?: string;
  /** Clases del precio efectivo. */
  priceClassName?: string;
}

/**
 * Muestra el precio efectivo de un producto y, si tiene oferta,
 * el precio original tachado al lado (ej: ~~459.000 COP~~ 349.000 COP).
 */
export default function PriceTag({
  product,
  className = 'mt-1 font-body text-sm',
  priceClassName = 'text-primary',
}: PriceTagProps) {
  const hasSale = product.salePrice !== undefined && product.salePrice < product.price;

  return (
    <p className={className}>
      {hasSale && (
        <span className="mr-2 text-on-surface-variant line-through">
          {formatPrice(product.price)}
        </span>
      )}
      <span className={priceClassName}>{formatPrice(getPrice(product))}</span>
    </p>
  );
}
