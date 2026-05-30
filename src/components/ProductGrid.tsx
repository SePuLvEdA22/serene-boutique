import { type Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export default function ProductGrid({ products, title }: ProductGridProps) {
  return (
    <section className="section-gap">
      {title && (
        <h2 className="mb-8 font-heading text-3xl font-medium text-on-surface md:text-4xl">
          {title}
        </h2>
      )}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-10 animate-stagger">
        {products.map((product) => (
          <div key={product.id} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[180px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
