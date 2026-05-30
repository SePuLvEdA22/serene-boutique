import ProductGrid from '@/components/ProductGrid';
import { getProductsByCategory } from '@/lib/products';

export default function FundasPage() {
  const products = getProductsByCategory('fundas');

  return (
    <div className="container-store py-12">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Fundas</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Protege tu dispositivo con estilo. Descubre nuestra colección de fundas diseñadas para cada personalidad.
        </p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
