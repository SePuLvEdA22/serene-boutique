'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('switch-tech-wishlist');
      if (stored) setWishlist(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('switch-tech-wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

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
    setWishlist((prev) => {
      if (prev.find((w) => w.productId === productId)) return prev;
      return [...prev, { productId, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => prev.filter((w) => w.productId !== productId));
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
