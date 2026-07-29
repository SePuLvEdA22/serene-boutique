'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/lib/format-price';
import type { Product } from '@/types';
import ProductImage from '@/components/ProductImage';
import Spinner from '@/components/Spinner';
import { personalizadoSchema, formatZodErrors } from '@/lib/validation';

export default function PersonalizadosPage() {
  const router = useRouter();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [selectedType, setSelectedType] = useState<'funda' | 'termo' | 'pack'>('funda');
  const [designDescription, setDesignDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products?category=personalizados')
      .then(res => res.json())
      .then(data => setCustomProducts(data.products))
      .catch(() => setCustomProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = loading ? null : (
    selectedType === 'funda'
      ? customProducts[0]
      : selectedType === 'termo'
      ? customProducts[1]
      : customProducts[2]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = personalizadoSchema.safeParse({ description: designDescription });
    if (!result.success) {
      setErrors(formatZodErrors(result.error.issues));
      return;
    }

    if (!selectedProduct) return;
    setIsSubmitting(true);

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Solicitud Personalizada',
          email: 'cliente@email.com',
          subject: `Personalizado: ${selectedProduct.name}`,
          message: `Tipo: ${selectedType}\nProducto: ${selectedProduct.name}\nDiseño: ${designDescription}\nArchivo: ${fileName || 'Ninguno'}`,
        }),
      });
    } catch {
      /* Silently log - order still proceeds */
    }

    addItem(selectedProduct);
    setIsSubmitting(false);
    addToast(`${selectedProduct.name} agregado al carrito`, 'success');
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="container-store py-12">
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container-store py-12">
        <div className="mx-auto max-w-lg rounded-2xl bg-surface-container p-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl font-medium text-on-surface">¡Recibimos tu diseño!</h2>
          <p className="mt-2 font-body text-base text-on-surface-variant">
            Te contactaremos pronto para confirmar los detalles de tu pedido personalizado.
          </p>
          <div className="mt-4 rounded-lg bg-surface-container-low p-4 text-left">
            <p className="font-body text-sm font-medium text-on-surface">Resumen:</p>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Producto: {selectedProduct?.name}<br />
              Diseño: {designDescription || 'Sin especificar'}{fileName ? `\nArchivo: ${fileName}` : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/carrito')}
            className="btn-primary mt-6"
          >
            Ver carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store py-12 animate-fade-in">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Personalizados</h1>
        <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-on-surface-variant">
          Crea algo único. Elige tu producto, cuéntanos tu idea y lo hacemos realidad.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-8 flex gap-3">
            {([
              { value: 'funda' as const, label: 'Funda' },
              { value: 'termo' as const, label: 'Termo' },
              { value: 'pack' as const, label: 'Pack' },
            ]).map((type) => (
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div>
              <label htmlFor="design-description" className="mb-2 block font-body text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                ¿Qué diseño tienes en mente? *
              </label>
              <textarea
                id="design-description"
                value={designDescription}
                onChange={(e) => setDesignDescription(e.target.value)}
                placeholder="Describe tu idea: colores, texto, imágenes, estilo..."
                rows={5}
                className={`input-field resize-none ${errors.description ? 'border-error' : ''}`}
                required
              />
              {errors.description && <p className="mt-1 font-body text-xs text-error" role="alert">{errors.description}</p>}
            </div>

            <div>
              <label htmlFor="file-upload" className="mb-2 block font-body text-sm font-medium text-on-surface-variant uppercase tracking-wider">
                Sube tu referencia (opcional)
              </label>
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-outline-variant p-8 transition-colors hover:border-primary"
              >
                <div className="text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-outline" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {fileName ? (
                    <p className="mt-2 font-body text-sm text-primary">{fileName}</p>
                  ) : (
                    <p className="mt-2 font-body text-sm text-on-surface-variant">
                      Arrastra o haz clic para subir
                    </p>
                  )}
                </div>
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2"><Spinner /> Agregando...</span>
              ) : `Agregar al carrito — ${selectedProduct ? formatPrice(selectedProduct.price) : ''}`}
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
