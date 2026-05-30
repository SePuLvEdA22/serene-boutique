'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/products';
import { type Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import ProductImage from './ProductImage';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [anim, setAnim] = useState<'idle' | 'adding' | 'done'>('idle');

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (anim !== 'idle') return;
    setAnim('adding');
    addItem(product);
    addToast(`${product.name} agregado al carrito`, 'success');
    setTimeout(() => setAnim('done'), 300);
    setTimeout(() => setAnim('idle'), 1500);
  };

  return (
    <div className="group flex flex-col">
      <Link href={`/producto/${product.id}`} className="relative mb-3 overflow-hidden rounded-xl">
        <ProductImage product={product} className="aspect-square rounded-xl" />
        <button
          onClick={handleAdd}
          disabled={anim !== 'idle'}
          className={`absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full text-on-primary shadow-soft transition-all duration-300 group-hover:opacity-100 ${
            anim === 'idle'
              ? 'bg-primary opacity-0 hover:bg-primary/90'
              : anim === 'adding'
              ? 'bg-primary scale-110 opacity-100'
              : 'bg-green-500 scale-100 opacity-100'
          }`}
          aria-label="Agregar al carrito"
        >
          <span
            className={`inline-flex transition-transform duration-300 ${
              anim === 'adding' ? 'rotate-90 scale-0' : anim === 'done' ? 'scale-100' : ''
            }`}
          >
            {anim === 'done' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </span>
        </button>
      </Link>
      <Link href={`/producto/${product.id}`}>
        <h3 className="font-heading text-base font-medium text-on-surface transition-colors group-hover:text-primary">
          {product.name}
        </h3>
      </Link>
      <p className="mt-1 font-body text-sm text-primary">{formatPrice(product.price)}</p>
    </div>
  );
}
