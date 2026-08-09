'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { type Product } from '@/lib/models';

const categories: { value: string; label: string }[] = [
  { value: 'fundas', label: 'Fundas' },
  { value: 'cargadores', label: 'Cargadores' },
  { value: 'termos', label: 'Termos' },
  { value: 'personalizados', label: 'Personalizados' },
];

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  /** `null` indica que se debe limpiar el precio de oferta. */
  salePrice?: number | null;
  category: string;
  featured: boolean;
  active: boolean;
  colors: string[];
  tags: string[];
  stock?: number;
  images: string[];
}

interface ProductFormProps {
  initial?: Product | null;
  submitLabel: string;
  saving: boolean;
  error?: string;
  onSubmit: (data: ProductFormData) => void;
  onCancelHref: string;
}

function parseList(value: string): string[] {
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

export default function ProductForm({
  initial = null,
  submitLabel,
  saving,
  error,
  onSubmit,
  onCancelHref,
}: ProductFormProps) {
  const { addToast } = useToast();
  const [images, setImages] = useState<string[]>(
    () => (initial?.images && initial.images.length > 0 ? initial.images : ['/images/placeholder.svg'])
  );
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const addImage = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setImages(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setImageUrl('');
  };

  const removeImage = (url: string) => {
    setImages(prev => prev.filter(u => u !== url));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
      addImage(data.url as string);
      addToast('Imagen subida', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al subir la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const price = Number((form.elements.namedItem('price') as HTMLInputElement).value);
    const saleValue = (form.elements.namedItem('salePrice') as HTMLInputElement).value;

    onSubmit({
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
      price,
      salePrice: saleValue === '' ? null : Number(saleValue),
      category: (form.elements.namedItem('category') as HTMLSelectElement).value,
      featured: (form.elements.namedItem('featured') as HTMLInputElement).checked,
      active: (form.elements.namedItem('active') as HTMLInputElement).checked,
      colors: parseList((form.elements.namedItem('colors') as HTMLInputElement).value),
      tags: parseList((form.elements.namedItem('tags') as HTMLInputElement).value),
      stock: (form.elements.namedItem('stock') as HTMLInputElement).value
        ? Number((form.elements.namedItem('stock') as HTMLInputElement).value)
        : undefined,
      images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-outline-variant/50 bg-surface p-6">
      <div>
        <label htmlFor="name" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Nombre *</label>
        <input id="name" name="name" type="text" className="input-field" defaultValue={initial?.name ?? ''} required />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Descripción</label>
        <textarea id="description" name="description" rows={4} className="input-field resize-none" defaultValue={initial?.description ?? ''} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Precio (COP) *</label>
          <input id="price" name="price" type="number" step="1" min="0" className="input-field" defaultValue={initial?.price ?? ''} required />
        </div>
        <div>
          <label htmlFor="salePrice" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Precio de oferta (COP)</label>
          <input id="salePrice" name="salePrice" type="number" step="1" min="0" className="input-field" defaultValue={initial?.salePrice ?? ''} placeholder="Opcional — menor que el precio" />
        </div>
      </div>

      {/* Imágenes */}
      <div>
        <p className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Imágenes</p>
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Imagen ${index + 1}`} className="h-20 w-20 rounded-lg border border-outline-variant/50 object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                disabled={images.length <= 1}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error text-xs transition-transform hover:scale-110 disabled:opacity-30"
                aria-label={`Quitar imagen ${index + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-outline-variant px-4 py-2 font-body text-sm text-on-surface-variant transition-colors hover:border-primary">
            {uploading ? 'Subiendo...' : 'Subir imagen'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
            />
          </label>
          <div className="flex flex-1 gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://... o /images/..."
              className="input-field flex-1"
            />
            <button type="button" onClick={() => addImage(imageUrl)} className="btn-secondary whitespace-nowrap">
              Añadir
            </button>
          </div>
        </div>
        <p className="mt-2 font-body text-xs text-on-surface-variant">
          La primera imagen es la principal del producto.
        </p>
      </div>

      <div>
        <label htmlFor="category" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Categoría *</label>
        <select id="category" name="category" className="input-field" defaultValue={initial?.category ?? 'fundas'} required>
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="stock" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Stock</label>
          <input id="stock" name="stock" type="number" min="0" className="input-field" defaultValue={initial?.stock ?? ''} placeholder="0" />
        </div>
        <div>
          <label htmlFor="colors" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Colores (separados por coma)</label>
          <input id="colors" name="colors" type="text" className="input-field" defaultValue={(initial?.colors || []).join(', ')} placeholder="Negro, Blanco, Rosa" />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="mb-2 block font-body text-xs font-medium uppercase tracking-wider text-on-surface-variant">Etiquetas (separadas por coma)</label>
        <input id="tags" name="tags" type="text" className="input-field" defaultValue={(initial?.tags || []).join(', ')} placeholder="oferta, nuevo, edición limitada" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input id="featured" name="featured" type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" defaultChecked={initial?.featured ?? false} />
          <span className="font-body text-sm text-on-surface">Destacado</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input id="active" name="active" type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" defaultChecked={initial?.active ?? true} />
          <span className="font-body text-sm text-on-surface">Visible en la tienda</span>
        </label>
      </div>

      {error && <p className="font-body text-sm text-error" role="alert">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? 'Guardando...' : submitLabel}
        </button>
        <Link href={onCancelHref} className="btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
