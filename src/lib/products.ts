import { type Product, type Category } from '@/lib/models';
import { getProductRepo } from './repositories';

export function getProductById(id: string): Product | undefined {
  return getProductRepo().findById(id);
}

export function getProductsByCategory(category: Category): Product[] {
  return getProductRepo().findByCategory(category);
}

export function getFeaturedProducts(): Product[] {
  return getProductRepo().getFeatured();
}