'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';
import PageHeader from '@/components/admin/PageHeader';

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
      <PageHeader title="Nuevo producto" subtitle="Crea un producto para tu catálogo" backHref="/admin/productos" backLabel="Volver a productos" />

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
