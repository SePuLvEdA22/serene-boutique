'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PriceTag from '@/components/PriceTag';
import type { Product } from '@/types';
import ProductImage from '@/components/ProductImage';
import Spinner from '@/components/Spinner';

export default function FavoritosPage() {
  const { wishlist, removeFromWishlist, user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setAllProducts(data.products))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const favoriteProducts = allProducts.filter((p) => wishlist.some((w) => w.productId === p.id));

  return (
    <div className="container-store py-12 animate-fade-in">
      <h1 className="mb-2 font-heading text-4xl font-medium text-on-surface md:text-5xl">Favoritos</h1>
      <p className="mb-10 font-body text-base text-on-surface-variant">
        {user ? 'Tus productos favoritos guardados.' : 'Inicia sesión para guardar tus favoritos.'}
      </p>

      {!user && (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-outline" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <p className="mt-4 font-body text-lg text-on-surface-variant">Inicia sesión para ver tus favoritos</p>
          <Link href="/iniciar-sesion" className="btn-primary mt-6 inline-block">
            Iniciar sesión
          </Link>
        </div>
      )}

      {user && loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      )}

      {user && !loading && favoriteProducts.length === 0 && (
        <div className="rounded-2xl bg-surface-container py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-outline" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <p className="mt-4 font-body text-lg text-on-surface-variant">No tienes favoritos aún</p>
          <p className="mt-1 font-body text-sm text-on-surface-variant">
            Explora productos y agrégalos a tus favoritos.
          </p>
          <Link href="/fundas" className="btn-primary mt-6 inline-block">
            Explorar productos
          </Link>
        </div>
      )}

      {user && !loading && favoriteProducts.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-10 animate-stagger">
          {favoriteProducts.map((product) => (
            <div key={product.id} className="w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] min-w-[180px] relative group">
              <Link href={`/producto/${product.id}`}>
                <ProductImage product={product} className="mb-3 aspect-square rounded-xl" />
                <h3 className="font-heading text-base font-medium text-on-surface transition-colors group-hover:text-primary">
                  {product.name}
                </h3>
                <PriceTag product={product} />
              </Link>
              <button
                onClick={() => removeFromWishlist(product.id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 text-error shadow-soft backdrop-blur-sm transition-transform hover:scale-110"
                aria-label={`Eliminar ${product.name} de favoritos`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
