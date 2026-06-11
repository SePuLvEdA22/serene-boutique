import { type Product, type Category } from '@/types';
import { initialProducts } from './product-data';

export function getProductById(id: string): Product | undefined {
  return initialProducts.find(p => p.id === id);
}

export function getProductsByCategory(category: Category): Product[] {
  return initialProducts.filter(p => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return initialProducts.filter(p => p.featured);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(price);
}

export const products = [...initialProducts];
