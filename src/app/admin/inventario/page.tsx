'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Product } from '@/types';
import { useToast } from '@/context/ToastContext';

export default function InventarioPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

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

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditStock(product.stock ?? 0);
  };

  const saveStock = async (id: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: editStock }),
      });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: editStock } : p));
      setEditingId(null);
      addToast('Stock actualizado', 'success');
    } catch {
      addToast('Error al actualizar stock', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 rounded bg-surface-container-high animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">Inventario</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">Gestiona el stock de tus productos</p>
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
                <th className="px-4 py-3 font-medium">Stock actual</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {products
                .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
                .map(product => (
                  <tr key={product.id} className="border-b border-outline-variant/30 transition-colors hover:bg-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">{product.name}</p>
                      <p className="text-xs text-on-surface-variant">{product.id}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-on-surface-variant">{product.category}</td>
                    <td className="px-4 py-3">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          min="0"
                          className="input-field w-24"
                          value={editStock}
                          onChange={e => setEditStock(Number(e.target.value))}
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold text-on-surface">{product.stock ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.stock !== undefined ? (
                        <span className={`chip ${
                          product.stock <= 0 ? 'bg-red-100 text-red-600' :
                          product.stock < 10 ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {product.stock <= 0 ? 'Agotado' : product.stock < 10 ? 'Poco stock' : 'En stock'}
                        </span>
                      ) : (
                        <span className="chip">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === product.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveStock(product.id)}
                            className="rounded-lg px-3 py-1.5 text-xs bg-primary text-on-primary transition-colors hover:bg-primary/90"
                            disabled={updating}
                          >
                            {updating ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(product)}
                          className="rounded-lg px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                        >
                          Editar stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 font-body text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          En stock (10+)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
          Poco stock (1–9)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
          Agotado (0)
        </div>
      </div>
    </div>
  );
}
