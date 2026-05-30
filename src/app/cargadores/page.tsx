import ProductGrid from '@/components/ProductGrid';
import { getProductsByCategory } from '@/lib/products';

export default function CargadoresPage() {
  const products = getProductsByCategory('cargadores');

  return (
    <div className="container-store py-12">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Cargadores</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Mantén tus dispositivos siempre listos. Carga rápida, inalámbrica y portátil para tu día a día.
        </p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
