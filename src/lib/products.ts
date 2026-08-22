import { type Product, type Category } from '@/lib/models';
import { getProductRepo } from './repositories';

export async function getProductById(id: string): Promise<Product | undefined> {
  const product = await getProductRepo().findById(id);
  return product && product.active !== false ? product : undefined;
}

export async function getProductsByCategory(category: Category): Promise<Product[]> {
  const products = await getProductRepo().findByCategory(category);
  return products.filter(p => p.active !== false);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProductRepo().getFeatured();
  return products.filter(p => p.active !== false);
}
