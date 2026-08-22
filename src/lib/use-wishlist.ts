'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

/**
 * Wishlist persistida en localStorage y sincronizada con useSyncExternalStore:
 * - getServerSnapshot devuelve [] (sin mismatch de hidratación).
 * - las mutaciones pasan por `writeWishlist`, que notifica a los suscriptores.
 * - el cache de la snapshot evita re-renders infinitos (referencia estable).
 *
 * No necesita Provider: el estado vive fuera de React (localStorage) y cada
 * consumidor se suscribe de forma independiente.
 */
const WISHLIST_KEY = 'switch-tech-wishlist';

/** Referencia estable para la snapshot vacía (evita bucles de re-render). */
const EMPTY_WISHLIST: WishlistItem[] = [];

let wishlistCache: WishlistItem[] | null = null;
const wishlistListeners = new Set<() => void>();

function readWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return EMPTY_WISHLIST;
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    wishlistCache = raw ? (JSON.parse(raw) as WishlistItem[]) : EMPTY_WISHLIST;
  } catch {
    wishlistCache = EMPTY_WISHLIST;
  }
  return wishlistCache;
}

function subscribeWishlist(callback: () => void): () => void {
  wishlistListeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === WISHLIST_KEY) {
      wishlistCache = null;
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    wishlistListeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getWishlistSnapshot(): WishlistItem[] {
  if (wishlistCache === null) wishlistCache = readWishlist();
  return wishlistCache;
}

function writeWishlist(next: WishlistItem[]): void {
  wishlistCache = next;
  try {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible */
  }
  wishlistListeners.forEach((listener) => listener());
}

/** Estado y operaciones de la wishlist del navegador (localStorage). */
export function useWishlist() {
  const wishlist = useSyncExternalStore(subscribeWishlist, getWishlistSnapshot, () => EMPTY_WISHLIST);

  const addToWishlist = useCallback((productId: string) => {
    const current = getWishlistSnapshot();
    if (current.some((w) => w.productId === productId)) return;
    writeWishlist([...current, { productId, addedAt: new Date().toISOString() }]);
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    writeWishlist(getWishlistSnapshot().filter((w) => w.productId !== productId));
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.some((w) => w.productId === productId),
    [wishlist]
  );

  return { wishlist, addToWishlist, removeFromWishlist, isInWishlist };
}
