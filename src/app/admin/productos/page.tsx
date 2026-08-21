'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, getPrice } from '@/lib/format-price';
import { type Product } from '@/lib/models';
import { CATEGORY_OPTIONS } from '@/lib/admin-constants';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/admin/PageHeader';
import SearchInput from '@/components/admin/SearchInput';
import FilterSelect from '@/components/admin/FilterSelect';
import EmptyState from '@/components/admin/EmptyState';
import Pagination from '@/components/admin/Pagination';
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
      <PageHeader
        title="Productos"
        subtitle={`${products.length} ${products.length === 1 ? 'producto' : 'productos'} en el catálogo`}
        actions={
          <Link href="/admin/productos/nuevo" className="btn-primary text-xs">
            + Nuevo producto
          </Link>
        }
      />

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar por nombre o ID..." label="Buscar productos" />
        <FilterSelect value={category} onChange={v => { setCategory(v); setPage(1); }} label="Filtrar por categoría" options={[{ value: 'all', label: 'Todas las categorías' }, ...CATEGORY_OPTIONS]} />
        <FilterSelect value={stockFilter} onChange={v => { setStockFilter(v); setPage(1); }} label="Filtrar por stock" className="sm:w-44" options={[
          { value: 'all', label: 'Todo el stock' },
          { value: 'in', label: 'En stock (10+)' },
          { value: 'low', label: 'Poco stock (1–9)' },
          { value: 'out', label: 'Agotado (0)' },
        ]} />
        <p className="font-body text-sm text-on-surface-variant sm:ml-auto">
          {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title={products.length === 0 ? 'No hay productos' : 'Sin resultados para los filtros'}
          description={products.length === 0 ? 'Crea tu primer producto para comenzar a vender.' : 'Ajusta la búsqueda o los filtros para ver más resultados.'}
          action={<Link href="/admin/productos/nuevo" className="btn-primary text-xs">+ Nuevo producto</Link>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Visible</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product) => {
                  const hasSale = product.salePrice !== undefined && product.salePrice < product.price;
                  const stock = product.stock ?? 0;
                  return (
                    <tr key={product.id} className="border-b border-outline-variant/30 transition-colors last:border-0 hover:bg-surface-container-low/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{product.name}</p>
                        <p className="text-xs text-on-surface-variant">{product.id}</p>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {categoryLabels[product.category] || product.category}
                      </td>
                      <td className="px-4 py-3 text-on-surface">
                        {hasSale && (
                          <span className="mr-2 text-xs text-on-surface-variant line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                        <span className={hasSale ? 'font-medium text-error' : ''}>
                          {formatPrice(getPrice(product))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`chip ${
                          stock <= 0 ? 'bg-red-100 text-red-600' :
                          stock < 10 ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {stock <= 0 ? 'Agotado' : stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {product.active !== false ? (
                          <span className="chip bg-green-100 text-green-600">Sí</span>
                        ) : (
                          <span className="chip bg-surface-container-high text-on-surface-variant">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/productos/${product.id}/edit`}
                            className="btn-ghost text-xs"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="btn-ghost text-xs"
                            title="Duplicar producto"
                          >
                            Duplicar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(product)}
                            className="btn-ghost text-xs text-error hover:text-error"
                            title="Eliminar producto"
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
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />

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