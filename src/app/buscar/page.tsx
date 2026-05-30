'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type Product } from '@/types';
import { formatPrice } from '@/lib/products';
import ProductImage from '@/components/ProductImage';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function BuscarPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQuery = useRef('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(async (q: string, page = 1) => {
    if (!q.trim()) {
      setResults([]);
      setPagination(null);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    currentQuery.current = q;

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&page=${page}&limit=8`);
      const data = await res.json();
      if (currentQuery.current === q) {
        setResults(data.products);
        setPagination(data.pagination);
      }
    } catch {
      if (currentQuery.current === q) {
        setResults([]);
        setPagination(null);
      }
    } finally {
      if (currentQuery.current === q) {
        setLoading(false);
      }
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  return (
    <div className="container-store py-12 animate-fade-in">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Buscar</h1>
        <p className="mt-3 font-body text-base text-on-surface-variant">
          Encuentra lo que buscas en nuestra tienda.
        </p>
      </div>

      <div className="relative mb-8">
        <label htmlFor="search-input" className="sr-only">Buscar productos</label>
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Busca por nombre, categoría o descripción..."
          className="input-field pl-12 text-lg"
        />
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setPagination(null); setSearched(false); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
            aria-label="Limpiar búsqueda"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[180px]">
              <div className="mb-3 aspect-square rounded-xl bg-surface-container-high animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-surface-container-high animate-pulse" />
              <div className="mt-2 h-4 w-1/4 rounded bg-surface-container-high animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-outline" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <p className="mt-4 font-body text-lg text-on-surface-variant">
            No encontramos resultados para &quot;{query}&quot;
          </p>
          <p className="mt-1 font-body text-sm text-on-surface-variant">
            Intenta con otros términos o revisa nuestras categorías.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/fundas" className="btn-secondary">Fundas</Link>
            <Link href="/cargadores" className="btn-secondary">Cargadores</Link>
            <Link href="/termos" className="btn-secondary">Termos</Link>
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="mb-6 font-body text-sm text-on-surface-variant">
            {pagination?.total ?? results.length} resultado{(pagination?.total ?? results.length) !== 1 ? 's' : ''} para &quot;{query}&quot;
            {pagination && pagination.totalPages > 1 && ` (página ${pagination.page} de ${pagination.totalPages})`}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-10 animate-stagger">
            {results.map((product) => (
              <div key={product.id} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[180px]">
                <Link href={`/producto/${product.id}`} className="group flex flex-col">
                  <ProductImage product={product} className="mb-3 aspect-square rounded-xl" />
                  <h3 className="font-heading text-base font-medium text-on-surface transition-colors group-hover:text-primary">
                    {product.name}
                  </h3>
                  <p className="mt-1 font-body text-sm text-primary">{formatPrice(product.price)}</p>
                </Link>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3" role="navigation" aria-label="Paginación">
              <button
                onClick={() => search(query, pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="btn-secondary px-4 py-2 disabled:opacity-30"
                aria-label="Página anterior"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Anterior
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => search(query, p)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg font-body text-sm transition-colors ${
                    p === pagination.page
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                  aria-label={`Ir a página ${p}`}
                  aria-current={p === pagination.page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => search(query, pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="btn-secondary px-4 py-2 disabled:opacity-30"
                aria-label="Página siguiente"
              >
                Siguiente
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
