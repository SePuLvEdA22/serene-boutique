import type { Product, Category } from '@/lib/models';
import type { IProductRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreProductRepository implements IProductRepository {
  async findAll(): Promise<Product[]> {
    return db.products.get();
  }

  async findById(id: string): Promise<Product | undefined> {
    const products = await db.products.get();
    return products.find(p => p.id === id);
  }

  async findByCategory(category: Category): Promise<Product[]> {
    const products = await db.products.get();
    return products.filter(p => p.category === category);
  }

  async search(query: string): Promise<Product[]> {
    const q = query.toLowerCase();
    const products = await db.products.get();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  async getFeatured(): Promise<Product[]> {
    const products = await db.products.get();
    return products.filter(p => p.featured);
  }

  async create(product: Product): Promise<void> {
    const products = await db.products.get();
    await db.products.set([...products, product]);
  }

  async update(id: string, data: Partial<Product>): Promise<Product | undefined> {
    const list = await db.products.get();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...data };
    list[index] = updated;
    await db.products.set(list);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const list = await db.products.get();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    await db.products.set(list);
    return true;
  }
}
