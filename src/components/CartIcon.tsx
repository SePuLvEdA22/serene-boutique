'use client';

import { useCart } from '@/context/CartContext';

export default function CartIcon() {
  const { totalItems, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 transition-colors hover:text-primary"
      aria-label="Abrir carrito"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
          {totalItems > 9 ? '9+' : totalItems}
        </span>
      )}
    </button>
  );
}
