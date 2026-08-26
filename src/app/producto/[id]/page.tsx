import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Category } from '@/lib/models';
import { getProductById, getProductsByCategory } from '@/lib/products';
import type { Product } from '@/types';
import ProductImage from '@/components/ProductImage';
import PriceTag from '@/components/PriceTag';
import Breadcrumbs from '@/components/Breadcrumbs';
import ProductJsonLd from '@/components/ProductJsonLd';
import ProductPurchasePanel from '@/components/ProductPurchasePanel';

function catLabel(cat: string) {
  return cat === 'fundas' ? 'Fundas' : cat === 'cargadores' ? 'Cargadores' : cat === 'termos' ? 'Termos' : 'Personalizados';
}

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Página de producto (Server Component): el HTML servido incluye nombre,
 * precio, descripción y JSON-LD — crítico para SEO. Solo el selector de
 * color/cantidad y el carrito son una isla de cliente.
 *
 * El título y la URL canónica los genera `generateMetadata` en layout.tsx.
 */
export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product: Product | undefined = await getProductById(id);

  if (!product) notFound();

  const related = (await getProductsByCategory(product.category as Category))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container-store py-12">
      <ProductJsonLd product={product} />

      <Breadcrumbs items={[
        { label: catLabel(product.category), href: `/${product.category}` },
        { label: product.name },
      ]} />

      <div className="grid gap-12 lg:grid-cols-2">
        <ProductImage product={product} className="aspect-square rounded-2xl" />

        <div className="flex flex-col justify-center">
          <span className="chip mb-3">Nuevo</span>
          <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">
            {product.name}
          </h1>
          <PriceTag
            product={product}
            className="mt-6 font-heading text-3xl font-medium"
            priceClassName="text-primary"
          />
          <p className="mt-6 font-body text-base leading-relaxed text-on-surface-variant">
            {product.description}
          </p>

          <ProductPurchasePanel product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-heading text-2xl font-medium text-on-surface">
            Productos relacionados
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {related.map((rel) => (
              <Link
                key={rel.id}
                href={`/producto/${rel.id}`}
                className="group w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[160px]"
              >
                <ProductImage product={rel} className="mb-3 aspect-square rounded-xl" />
                <h3 className="font-body text-sm font-medium text-on-surface transition-colors group-hover:text-primary">
                  {rel.name}
                </h3>
                <PriceTag product={rel} className="mt-1 font-body text-sm" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
