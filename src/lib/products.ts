import { type Product, type Category } from '@/types';
import { db } from './db';

export function getProductById(id: string): Product | undefined {
  return db.products.get().find(p => p.id === id);
}

export function getProductsByCategory(category: Category): Product[] {
  return db.products.get().filter(p => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return db.products.get().filter(p => p.featured);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(price);
}

export const products = db.products.get();
