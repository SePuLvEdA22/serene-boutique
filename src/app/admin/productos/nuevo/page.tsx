'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';

export default function NuevoProductoPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: ProductFormData) => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Error al crear producto');
      }

      addToast('Producto creado', 'success');
      router.push('/admin/productos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto');
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/productos"
          className="mb-2 inline-flex items-center gap-1 font-body text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver a productos
        </Link>
        <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">Nuevo producto</h1>
      </div>

      <ProductForm
        initial={null}
        submitLabel="Crear producto"
        saving={saving}
        error={error}
        onSubmit={handleSubmit}
        onCancelHref="/admin/productos"
      />
    </div>
  );
}
