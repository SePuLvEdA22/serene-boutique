'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { type CartItem, type Product } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number; selectedColor?: string } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; selectedColor?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number; selectedColor?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'HYDRATE'; payload: CartItem[] };

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number, selectedColor?: string) => void;
  removeItem: (productId: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, selectedColor } = action.payload;
      const existingIndex = state.items.findIndex(
        item => item.product.id === product.id && item.selectedColor === selectedColor
      );

      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
        return { ...state, items: newItems };
      }

      return {
        ...state,
        items: [...state.items, { product, quantity, selectedColor }],
      };
    }
    case 'REMOVE_ITEM': {
      const { productId, selectedColor } = action.payload;
      return {
        ...state,
        items: state.items.filter(
          item => !(item.product.id === productId && item.selectedColor === selectedColor)
        ),
      };
    }
    case 'UPDATE_QUANTITY': {
      const { productId, quantity, selectedColor } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            item => !(item.product.id === productId && item.selectedColor === selectedColor)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === productId && item.selectedColor === selectedColor
            ? { ...item, quantity }
            : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'HYDRATE':
      return { ...state, items: action.payload };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('switch-tech-cart');
      if (stored) {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(stored) });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('switch-tech-cart', JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const addItem = useCallback((product: Product, quantity = 1, selectedColor?: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, selectedColor } });
  }, []);

  const removeItem = useCallback((productId: string, selectedColor?: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, selectedColor } });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedColor?: string) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, selectedColor } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' });
  }, []);

  const totalItems = useMemo(() => state.items.reduce((acc, item) => acc + item.quantity, 0), [state.items]);
  const totalPrice = useMemo(() => state.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [state.items]);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
