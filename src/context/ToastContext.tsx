'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  createdAt: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION = 3500;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hoveredIdRef = useRef<string | null>(null);

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const startTimer = useCallback((id: string) => {
    clearTimer(id);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, TOAST_DURATION);
    timersRef.current.set(id, timer);
  }, [clearTimer]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const toast: Toast = { id, message, type, createdAt: Date.now() };
    setToasts((prev) => {
      const exists = prev.some(
        (t) => t.message === message && t.type === type && Date.now() - t.createdAt < 2000
      );
      if (exists) return prev;
      return [...prev, toast];
    });
    startTimer(id);
  }, [startTimer]);

  const removeToast = useCallback((id: string) => {
    clearTimer(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearTimer]);

  const handleMouseEnter = useCallback((id: string) => {
    hoveredIdRef.current = id;
    clearTimer(id);
  }, [clearTimer]);

  const handleMouseLeave = useCallback((id: string) => {
    if (hoveredIdRef.current === id) {
      hoveredIdRef.current = null;
      startTimer(id);
    }
  }, [startTimer]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        aria-live="polite"
        aria-label="Notificaciones"
        role="log"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 rounded-xl px-4 py-3 font-body text-sm shadow-medium animate-fade-in ${
              toast.type === 'success'
                ? 'bg-primary-container text-on-primary-container'
                : toast.type === 'error'
                ? 'bg-error-container text-on-error-container'
                : 'bg-surface-container-high text-on-surface'
            }`}
            onMouseEnter={() => handleMouseEnter(toast.id)}
            onMouseLeave={() => handleMouseLeave(toast.id)}
          >
            <span className="mt-0.5 flex-shrink-0">
              {toast.type === 'success' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 mt-0.5 opacity-60 transition-opacity hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
