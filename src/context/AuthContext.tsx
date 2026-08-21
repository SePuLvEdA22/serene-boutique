'use client';

import { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

interface WishlistItem {
  productId: string;
  addedAt: string;
}

/**
 * Wishlist persistida en localStorage y sincronizada con useSyncExternalStore:
 * - getServerSnapshot devuelve [] (sin mismatch de hidratación).
 * - las mutaciones pasan por `writeWishlist`, que notifica a los suscriptores.
 * - el cache de la snapshot evita re-renders infinitos (referencia estable).
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

export interface LoginResult {
  error: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string, consent: boolean) => Promise<string | null>;
  deleteAccount: (password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  wishlist: WishlistItem[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const wishlist = useSyncExternalStore(subscribeWishlist, getWishlistSnapshot, () => EMPTY_WISHLIST);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Error al iniciar sesión', isAdmin: false };
      setUser(data.user);
      return { error: null, isAdmin: data.isAdmin === true };
    } catch {
      return { error: 'Error de conexión', isAdmin: false };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, consent: boolean): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, consent }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Error al registrar';
      return null;
    } catch {
      return 'Error de conexión';
    }
  }, []);

  const deleteAccount = useCallback(async (password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || 'Error al eliminar la cuenta';
      setUser(null);
      try { localStorage.removeItem('switch-tech-cart'); } catch {}
      window.dispatchEvent(new CustomEvent('cart:clear'));
      return null;
    } catch {
      return 'Error de conexión';
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    try { localStorage.removeItem('switch-tech-cart'); } catch {}
    window.dispatchEvent(new CustomEvent('cart:clear'));
  }, []);

  const addToWishlist = useCallback((productId: string) => {
    const current = getWishlistSnapshot();
    if (current.some((w) => w.productId === productId)) return;
    writeWishlist([...current, { productId, addedAt: new Date().toISOString() }]);
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    writeWishlist(getWishlistSnapshot().filter((w) => w.productId !== productId));
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some((w) => w.productId === productId);
  }, [wishlist]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, deleteAccount, logout, wishlist, addToWishlist, removeFromWishlist, isInWishlist }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
