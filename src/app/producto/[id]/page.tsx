'use client';

import { useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { products, getProductById, formatPrice } from '@/lib/products';
import ProductImage from '@/components/ProductImage';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const product = getProductById(params.id);

function catLabel(cat: string) {
  return cat === 'fundas' ? 'Fundas' : cat === 'cargadores' ? 'Cargadores' : cat === 'termos' ? 'Termos' : 'Personalizados';
}

  const { addItem } = useCart();
  const { addToast } = useToast();
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) notFound();

  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addItem(product, quantity, selectedColor);
    addToast(`${product.name} agregado al carrito`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="container-store py-12">
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
          <p className="mt-6 font-heading text-3xl font-medium text-primary">
            {formatPrice(product.price)}
          </p>
          <p className="mt-6 font-body text-base leading-relaxed text-on-surface-variant">
            {product.description}
          </p>

          {product.colors && product.colors.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Color: <span className="text-on-surface">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-lg border px-4 py-2 font-body text-sm transition-all ${
                      selectedColor === color
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-outline-variant">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-12 w-12 items-center justify-center text-lg transition-colors hover:bg-surface-container"
              >
                -
              </button>
              <span className="flex h-12 w-12 items-center justify-center font-body text-base">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-12 w-12 items-center justify-center text-lg transition-all duration-150 active:scale-90 hover:bg-surface-container"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className={`btn-primary flex-1 transition-all ${
                added ? 'bg-green-600 hover:bg-green-600' : ''
              }`}
            >
              {added ? (
                <span className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Agregado
                </span>
              ) : (
                'Agregar al carrito'
              )}
            </button>
          </div>
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
                <p className="mt-1 font-body text-sm text-primary">{formatPrice(rel.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
