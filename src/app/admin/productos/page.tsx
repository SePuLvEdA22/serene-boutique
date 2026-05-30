'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/products';
import { type Product } from '@/types';

export default function AdminProductosPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/products')
      .then(res => {
        if (res.status === 401) { router.push('/admin/login'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setProducts(data.products);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn-primary text-xs">
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <p className="font-body text-lg text-on-surface-variant">No hay productos</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/50 bg-surface">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-outline-variant/50 text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Destacado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-outline-variant/30 transition-colors hover:bg-surface-container-low">
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{product.name}</p>
                    <p className="text-xs text-on-surface-variant">{product.id}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-on-surface-variant">{product.category}</td>
                  <td className="px-4 py-3 text-on-surface">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    {product.featured ? (
                      <span className="chip bg-green-100 text-green-600">Sí</span>
                    ) : (
                      <span className="chip">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/productos/${product.id}/edit`}
                        className="rounded-lg px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="rounded-lg px-3 py-1.5 text-xs text-error transition-colors hover:bg-error-container/50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
