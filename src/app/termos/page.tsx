import ProductGrid from '@/components/ProductGrid';
import { getProductsByCategory } from '@/lib/products';

export default function TermosPage() {
  const products = getProductsByCategory('termos');

  return (
    <div className="container-store py-12">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Termos</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Lleva tu esencia a donde vayas. Termos que mantienen la temperatura y reflejan tu estilo.
        </p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
