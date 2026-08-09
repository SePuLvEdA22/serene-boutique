import { type Product, type Category } from '@/lib/models';
import { getProductRepo } from './repositories';

export function getProductById(id: string): Product | undefined {
  const product = getProductRepo().findById(id);
  return product && product.active !== false ? product : undefined;
}

export function getProductsByCategory(category: Category): Product[] {
  return getProductRepo().findByCategory(category).filter(p => p.active !== false);
}

export function getFeaturedProducts(): Product[] {
  return getProductRepo().getFeatured().filter(p => p.active !== false);
}
