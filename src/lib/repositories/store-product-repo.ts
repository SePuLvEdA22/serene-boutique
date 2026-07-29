import type { Product, Category } from '@/lib/models';
import type { IProductRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreProductRepository implements IProductRepository {
  findAll(): Product[] {
    return db.products.get();
  }

  findById(id: string): Product | undefined {
    return db.products.get().find(p => p.id === id);
  }

  findByCategory(category: Category): Product[] {
    return db.products.get().filter(p => p.category === category);
  }

  search(query: string): Product[] {
    const q = query.toLowerCase();
    return db.products.get().filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  getFeatured(): Product[] {
    return db.products.get().filter(p => p.featured);
  }

  create(product: Product): void {
    db.products.set([...db.products.get(), product]);
  }

  update(id: string, data: Partial<Product>): Product | undefined {
    const list = db.products.get();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...data };
    list[index] = updated;
    db.products.set(list);
    return updated;
  }

  delete(id: string): boolean {
    const list = db.products.get();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    db.products.set(list);
    return true;
  }
}
