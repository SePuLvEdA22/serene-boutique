import type { Product } from '@/lib/models';
import { getPrice } from '@/lib/format-price';

interface ProductJsonLdProps {
  product: Product;
}

/**
 * Renderiza datos estructurados Schema.org para un producto.
 * Habilita rich snippets en Google: precio, disponibilidad, reseñas.
 *
 * @see https://schema.org/Product
 */
export default function ProductJsonLd({ product }: ProductJsonLdProps) {
  const availability = product.stock !== undefined && product.stock > 0
    ? 'https://schema.org/InStock'
    : product.stock === 0
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || product.images?.[0] || undefined,
    sku: product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Switch&Tech',
    },
    offers: {
      '@type': 'Offer',
      url: `https://switchandtech.com/producto/${product.id}`,
      priceCurrency: 'COP',
      price: getPrice(product),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Switch&Tech',
      },
    },
    ...(product.colors && product.colors.length > 0
      ? { color: product.colors.join(', ') }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
