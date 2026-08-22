import type { Promo } from '@/lib/models/promo';
import type { IPromoRepository } from './interfaces';
import { db } from '@/lib/db';

export class StorePromoRepository implements IPromoRepository {
  async findAll(): Promise<Promo[]> {
    return db.promos.get();
  }

  async findById(id: string): Promise<Promo | undefined> {
    const promos = await db.promos.get();
    return promos.find((p) => p.id === id);
  }

  async findByCode(code: string): Promise<Promo | undefined> {
    const normalized = code.trim().toUpperCase();
    const promos = await db.promos.get();
    return promos.find((p) => p.code === normalized);
  }

  async create(promo: Promo): Promise<void> {
    const promos = await db.promos.get();
    await db.promos.set([...promos, promo]);
  }

  async update(id: string, data: Partial<Promo>): Promise<Promo | undefined> {
    const promos = await db.promos.get();
    const target = promos.find((p) => p.id === id);
    if (!target) return undefined;
    const updated = { ...target, ...data, id: target.id };
    await db.promos.set(promos.map((p) => (p.id === id ? updated : p)));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const promos = await db.promos.get();
    const next = promos.filter((p) => p.id !== id);
    if (next.length === promos.length) return false;
    await db.promos.set(next);
    return true;
  }

  async incrementUsage(id: string): Promise<Promo | undefined> {
    const promos = await db.promos.get();
    const target = promos.find((p) => p.id === id);
    if (!target) return undefined;
    const updated = { ...target, usedCount: (target.usedCount ?? 0) + 1 };
    await db.promos.set(promos.map((p) => (p.id === id ? updated : p)));
    return updated;
  }
}
