'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';
import { type Product } from '@/lib/models';

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/products/${params.id}`)
      .then(res => {
        if (res.status === 401) { router.push('/admin/login'); return null; }
        if (res.status === 404) { router.push('/admin/productos'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setProduct(data.product);
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleSubmit = async (data: ProductFormData) => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Error al guardar');
      }

      addToast('Producto actualizado', 'success');
      router.push('/admin/productos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        <div className="h-96 rounded-xl bg-surface-container-high animate-pulse" />
      </div>
    );
  }

  if (!product) return null;

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
        <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">Editar producto</h1>
        <p className="font-body text-xs text-on-surface-variant">ID: {product.id}</p>
      </div>

      <ProductForm
        initial={product}
        submitLabel="Guardar cambios"
        saving={saving}
        error={error}
        onSubmit={handleSubmit}
        onCancelHref="/admin/productos"
      />
    </div>
  );
}
