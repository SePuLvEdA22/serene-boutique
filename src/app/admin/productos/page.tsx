'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, getPrice } from '@/lib/format-price';
import { type Product } from '@/lib/models';
import { useToast } from '@/context/ToastContext';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

const PAGE_SIZE = 10;

const categoryLabels: Record<string, string> = {
  fundas: 'Fundas',
  cargadores: 'Cargadores',
  termos: 'Termos',
  personalizados: 'Personalizados',
};

export default function AdminProductosPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (stockFilter === 'out' && (p.stock ?? 0) > 0) return false;
      if (stockFilter === 'low' && !((p.stock ?? 0) > 0 && (p.stock ?? 0) < 10)) return false;
      if (stockFilter === 'in' && (p.stock ?? 0) < 10) return false;
      return true;
    });
  }, [products, search, category, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.filter(p => p.id !== confirmDelete.id));
      addToast('Producto eliminado', 'success');
    } catch {
      addToast('Error al eliminar el producto', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleDuplicate = async (product: Product) => {
    // Reintenta con sufijos si el slug del nombre ya existe (409).
    for (let attempt = 1; attempt <= 5; attempt++) {
      const name = attempt === 1 ? `${product.name} (copia)` : `${product.name} (copia ${attempt})`;
      try {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: product.description,
            price: product.price,
            salePrice: product.salePrice,
            images: product.images,
            category: product.category,
            featured: product.featured,
            active: false,
            colors: product.colors,
            tags: product.tags,
            stock: product.stock,
          }),
        });
        const data = await res.json();
        if (res.status === 409 && attempt < 5) continue;
        if (!res.ok) throw new Error(data.error || 'Error al duplicar');
        setProducts(prev => [...prev, data.product]);
        addToast('Producto duplicado (inactivo)', 'success');
        return;
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Error al duplicar el producto', 'error');
        return;
      }
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-medium text-on-surface md:text-3xl">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn-primary text-xs">
          + Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nombre o ID..."
          className="input-field sm:max-w-xs"
          aria-label="Buscar productos"
        />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input-field sm:w-44" aria-label="Filtrar por categoría">
          <option value="all">Todas las categorías</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }} className="input-field sm:w-40" aria-label="Filtrar por stock">
          <option value="all">Todo el stock</option>
          <option value="in">En stock (10+)</option>
          <option value="low">Poco stock (1–9)</option>
          <option value="out">Agotado (0)</option>
        </select>
        <p className="font-body text-sm text-on-surface-variant">
          {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {paginated.length === 0 ? (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <p className="font-body text-lg text-on-surface-variant">
            {products.length === 0 ? 'No hay productos' : 'Sin resultados para los filtros'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant/50 bg-surface">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="border-b border-outline-variant/50 text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Visible</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((product) => {
                const hasSale = product.salePrice !== undefined && product.salePrice < product.price;
                return (
                  <tr key={product.id} className="border-b border-outline-variant/30 transition-colors hover:bg-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">{product.name}</p>
                      <p className="text-xs text-on-surface-variant">{product.id}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-on-surface-variant">
                      {categoryLabels[product.category] || product.category}
                    </td>
                    <td className="px-4 py-3 text-on-surface">
                      {hasSale && (
                        <span className="mr-2 text-xs text-on-surface-variant line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                      <span className={hasSale ? 'text-error font-medium' : ''}>
                        {formatPrice(getPrice(product))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip ${
                        (product.stock ?? 0) <= 0 ? 'bg-red-100 text-red-600' :
                        (product.stock ?? 0) < 10 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {(product.stock ?? 0) <= 0 ? 'Agotado' : product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.active !== false ? (
                        <span className="chip bg-green-100 text-green-600">Sí</span>
                      ) : (
                        <span className="chip">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/productos/${product.id}/edit`}
                          className="rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="rounded-lg px-2.5 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                          title="Duplicar producto"
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(product)}
                          className="rounded-lg px-2.5 py-1.5 text-xs text-error transition-colors hover:bg-error-container/50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border border-outline-variant px-3 py-1.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="px-3 font-body text-sm text-on-surface-variant">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-outline-variant px-3 py-1.5 font-body text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Eliminar producto"
        message={confirmDelete ? `¿Eliminar "${confirmDelete.name}"? Esta acción no se puede deshacer.` : ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
