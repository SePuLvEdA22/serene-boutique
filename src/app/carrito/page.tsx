'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/products';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-store py-12">
        <h1 className="mb-8 font-heading text-4xl font-medium text-on-surface md:text-5xl">Carrito</h1>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-container py-20 text-center">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-outline">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <p className="mt-4 font-body text-lg text-on-surface-variant">Tu carrito está vacío</p>
          <Link href="/fundas" className="btn-primary mt-6">
            Comenzar a comprar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-store py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-4xl font-medium text-on-surface md:text-5xl">Carrito</h1>
        <button
          onClick={clearCart}
          className="font-body text-sm text-on-surface-variant underline transition-colors hover:text-error"
        >
          Vaciar carrito
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedColor}`}
                className="flex gap-6 rounded-2xl bg-surface-container-low p-4"
              >
                <ProductImage product={item.product} className="h-24 w-24 flex-shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/producto/${item.product.id}`}
                      className="font-heading text-base font-medium text-on-surface transition-colors hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                    {item.selectedColor && (
                      <p className="mt-1 font-body text-sm text-on-surface-variant">
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
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant text-sm transition-colors hover:bg-surface-container"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-body text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1, item.selectedColor)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-outline-variant text-sm transition-all duration-150 active:scale-90 hover:bg-surface-container"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.selectedColor)}
                      className="font-body text-sm text-outline transition-colors hover:text-error"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-surface-container p-6">
            <h2 className="font-heading text-xl font-medium text-on-surface">Resumen</h2>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex justify-between font-body text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="text-on-surface">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-on-surface-variant">Envío</span>
                <span className="text-on-surface">Calculado al pagar</span>
              </div>
              <div className="border-t border-outline-variant/50 pt-3">
                <div className="flex justify-between">
                  <span className="font-body text-base font-medium text-on-surface">Total</span>
                  <span className="font-heading text-xl font-medium text-primary">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
            <button className="btn-primary mt-6 w-full">
              Proceder al pago
            </button>
            <Link
              href="/fundas"
              className="mt-3 block text-center font-body text-sm text-on-surface-variant underline transition-colors hover:text-primary"
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
