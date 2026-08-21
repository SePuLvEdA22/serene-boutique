'use client';

import { createContext, useContext, useEffect, useCallback, useSyncExternalStore, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'theme';

/**
 * Tema sincronizado con localStorage mediante useSyncExternalStore:
 * - getServerSnapshot ('light') evita mismatches de hidratación.
 * - las escrituras pasan por `setThemeValue`, que notifica a los suscriptores.
 * - `documentElement.dark` se aplica en un effect (mutación de DOM externo).
 */
const themeListeners = new Set<() => void>();

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeTheme(callback: () => void): () => void {
  themeListeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    themeListeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getThemeSnapshot(): Theme {
  return readTheme();
}

function setThemeValue(value: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, value);
  } catch {
    /* almacenamiento no disponible */
  }
  themeListeners.forEach((listener) => listener());
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, (): Theme => 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeValue(theme === 'light' ? 'dark' : 'light');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}