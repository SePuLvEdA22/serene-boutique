'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { type Product, type Category } from '@/types';

const categories: { value: Category; label: string }[] = [
  { value: 'fundas', label: 'Fundas' },
  { value: 'cargadores', label: 'Cargadores' },
  { value: 'termos', label: 'Termos' },
  { value: 'personalizados', label: 'Personalizados' },
];

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    setError('');

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      price: Number((form.elements.namedItem('price') as HTMLInputElement).value),
      category: (form.elements.namedItem('category') as HTMLSelectElement).value,
      featured: (form.elements.namedItem('featured') as HTMLInputElement).checked,
      colors: (form.elements.namedItem('colors') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean),
      stock: (form.elements.namedItem('stock') as HTMLInputElement).value ? Number((form.elements.namedItem('stock') as HTMLInputElement).value) : undefined,
    };

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      router.push('/admin/productos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
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
        <Link href="/admin/productos" className="mb-2 inline-flex items-center gap-1 font-body text-sm text-on-surface-variant transition-colors hover:text-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver a productos
        </Link>
        <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">Editar producto</h1>
        <p className="font-body text-xs text-on-surface-variant">ID: {product.id}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-outline-variant/50 bg-surface p-6">
        <div>
          <label htmlFor="name" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Nombre</label>
          <input id="name" name="name" type="text" className="input-field" defaultValue={product.name} required />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Descripción</label>
          <textarea id="description" name="description" rows={4} className="input-field resize-none" defaultValue={product.description} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Precio</label>
            <input id="price" name="price" type="number" step="0.01" min="0" className="input-field" defaultValue={product.price} required />
          </div>
          <div>
            <label htmlFor="category" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Categoría</label>
            <select id="category" name="category" className="input-field" defaultValue={product.category} required>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="stock" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Stock</label>
            <input id="stock" name="stock" type="number" min="0" className="input-field" defaultValue={product.stock ?? ''} />
          </div>
          <div>
            <label htmlFor="colors" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Colores (separados por coma)</label>
            <input id="colors" name="colors" type="text" className="input-field" defaultValue={(product.colors || []).join(', ')} />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input id="featured" name="featured" type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" defaultChecked={product.featured} />
          <span className="font-body text-sm text-on-surface">Producto destacado</span>
        </label>

        {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
