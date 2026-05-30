'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { products, formatPrice } from '@/lib/products';
import ProductImage from '@/components/ProductImage';

export default function PersonalizadosPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedType, setSelectedType] = useState<'funda' | 'termo' | 'pack'>('funda');
  const [designDescription, setDesignDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const customProducts = products.filter(p => p.category === 'personalizados');
  const selectedProduct = selectedType === 'funda'
    ? customProducts[0]
    : selectedType === 'termo'
    ? customProducts[1]
    : customProducts[2];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      addItem(selectedProduct);
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container-store py-12">
        <div className="mx-auto max-w-lg rounded-2xl bg-surface-container p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl font-medium text-on-surface">¡Recibimos tu diseño!</h2>
          <p className="mt-2 font-body text-base text-on-surface-variant">
            Te contactaremos pronto para confirmar los detalles de tu pedido personalizado.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary mt-6"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store py-12">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Personalizados</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Crea algo único. Elige tu producto, cuéntanos tu idea y lo hacemos realidad.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-8 flex gap-3">
            {[
              { value: 'funda' as const, label: 'Funda' },
              { value: 'termo' as const, label: 'Termo' },
              { value: 'pack' as const, label: 'Pack' },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`rounded-lg border px-5 py-3 font-body text-sm font-medium uppercase tracking-widest transition-all ${
                  selectedType === type.value
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block font-body text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                ¿Qué diseño tienes en mente?
              </label>
              <textarea
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                placeholder="Describe tu idea: colores, texto, imágenes, estilo..."
                rows={5}
                className="input-field resize-none"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-body text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                Sube tu referencia (opcional)
              </label>
              <div className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-outline-variant p-8 transition-colors hover:border-primary">
                <div className="text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-outline">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="mt-2 font-body text-sm text-on-surface-variant">
                    Arrastra o haz clic para subir
                  </p>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              Agregar al carrito — {selectedProduct ? formatPrice(selectedProduct.price) : ''}
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-surface-container p-8">
          {selectedProduct && (
            <>
              <ProductImage product={selectedProduct} className="mb-6 aspect-square rounded-xl" />
              <h3 className="font-heading text-xl font-medium text-on-surface">
                {selectedProduct.name}
              </h3>
              <p className="mt-2 font-body text-base leading-relaxed text-on-surface-variant">
                {selectedProduct.description}
              </p>
              <p className="mt-4 font-heading text-2xl font-medium text-primary">
                {formatPrice(selectedProduct.price)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
