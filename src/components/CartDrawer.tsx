'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/products';
import ProductImage from './ProductImage';

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, totalPrice } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={toggleCart}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-medium">
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
          <h2 className="font-heading text-xl font-medium">Carrito</h2>
          <button
            onClick={toggleCart}
            className="p-2 transition-colors hover:text-primary"
            aria-label="Cerrar carrito"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-outline">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <p className="text-on-surface-variant">Tu carrito está vacío</p>
            <button onClick={toggleCart} className="btn-primary">
              Seguir comprando
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedColor}`}
                    className="flex gap-4 rounded-xl bg-surface-container-low p-3"
                  >
                    <ProductImage product={item.product} className="h-20 w-20 flex-shrink-0 rounded-lg" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-body text-sm font-medium text-on-surface">
                          {item.product.name}
                        </h3>
                        {item.selectedColor && (
                          <p className="font-body text-xs text-on-surface-variant">
                            Color: {item.selectedColor}
                          </p>
                        )}
                        <p className="mt-1 font-body text-sm text-primary">
                          {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1, item.selectedColor)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-outline-variant text-sm transition-colors hover:bg-surface-container"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-body text-sm">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1, item.selectedColor)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-outline-variant text-sm transition-all duration-150 active:scale-90 hover:bg-surface-container"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedColor)}
                          className="text-sm text-outline transition-colors hover:text-error"
                          aria-label="Eliminar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-outline-variant px-6 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-body text-base text-on-surface">Total</span>
                <span className="font-heading text-xl font-medium text-primary">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <Link
                href="/carrito"
                onClick={toggleCart}
                className="btn-primary w-full"
              >
                Ver carrito
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
