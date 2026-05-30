'use client';

import { useState, useMemo } from 'react';
import { type Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductFiltersProps {
  products: Product[];
  title?: string;
}

export default function ProductFilters({ products, title }: ProductFiltersProps) {
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  const sorted = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [products, sortBy]);

  if (products.length === 0) {
    return (
      <section className="section-gap">
        {title && (
          <h2 className="mb-8 font-heading text-3xl font-medium text-on-surface md:text-4xl">
            {title}
          </h2>
        )}
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <p className="font-body text-lg text-on-surface-variant">
            No hay productos en esta categoría
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-gap">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {title && (
          <h2 className="font-heading text-3xl font-medium text-on-surface md:text-4xl">
            {title}
          </h2>
        )}
        <div className="flex items-center gap-3">
          <label htmlFor="sort-select" className="sr-only">Ordenar por</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 font-body text-sm text-on-surface transition-colors focus:border-primary"
          >
            <option value="default">Ordenar por</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre: A-Z</option>
          </select>
          <span className="font-body text-sm text-on-surface-variant">
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-10 animate-stagger">
        {sorted.map((product) => (
          <div key={product.id} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[180px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
