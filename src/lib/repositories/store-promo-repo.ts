import type { Promo } from '@/lib/models/promo';
import type { IPromoRepository } from './interfaces';
import { db } from '@/lib/db';

export class StorePromoRepository implements IPromoRepository {
  findAll(): Promo[] {
    return db.promos.get();
  }

  findById(id: string): Promo | undefined {
    return db.promos.get().find((p) => p.id === id);
  }

  findByCode(code: string): Promo | undefined {
    const normalized = code.trim().toUpperCase();
    return db.promos.get().find((p) => p.code === normalized);
  }

  create(promo: Promo): void {
    db.promos.set([...db.promos.get(), promo]);
  }

  update(id: string, data: Partial<Promo>): Promo | undefined {
    const promos = db.promos.get();
    const target = promos.find((p) => p.id === id);
    if (!target) return undefined;
    const updated = { ...target, ...data, id: target.id };
    db.promos.set(promos.map((p) => (p.id === id ? updated : p)));
    return updated;
  }

  delete(id: string): boolean {
    const promos = db.promos.get();
    const next = promos.filter((p) => p.id !== id);
    if (next.length === promos.length) return false;
    db.promos.set(next);
    return true;
  }

  incrementUsage(id: string): Promo | undefined {
    const promos = db.promos.get();
    const target = promos.find((p) => p.id === id);
    if (!target) return undefined;
    const updated = { ...target, usedCount: (target.usedCount ?? 0) + 1 };
    db.promos.set(promos.map((p) => (p.id === id ? updated : p)));
    return updated;
  }
}