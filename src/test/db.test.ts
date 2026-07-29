import { describe, it, expect, beforeEach } from 'vitest';
import { resetStore } from '@/lib/store';

beforeEach(() => {
  const g = globalThis as Record<string, unknown>;
  g.__store_data = undefined;
  g.__adminInitialized = false;
  resetStore();
});

describe('db store (import-time seeding)', () => {
  it('seeds products on first access', async () => {
    const { db } = await import('@/lib/db');
    expect(db.products.get().length).toBeGreaterThan(0);
    expect(db.products.get()[0]).toHaveProperty('id');
    expect(db.products.get()[0]).toHaveProperty('name');
    expect(db.products.get()[0]).toHaveProperty('price');
  });

  it('initializes orders as empty array', async () => {
    const { db } = await import('@/lib/db');
    expect(db.orders.get()).toEqual([]);
  });

  it('preserves products across multiple accesses via singleton', async () => {
    const { db } = await import('@/lib/db');
    const initialCount = db.products.get().length;
    db.products.set(db.products.get().filter(p => p.category === 'fundas'));
    const { db: db2 } = await import('@/lib/db');
    expect(db2.products.get().length).toBeLessThan(initialCount);
    expect(db2.products.get().every(p => p.category === 'fundas')).toBe(true);
  });
});

describe('db users', () => {
  it('starts as empty array', async () => {
    const { db } = await import('@/lib/db');
    expect(db.users.get()).toEqual([]);
  });

  it('persists across re-imports via singleton', async () => {
    const { db } = await import('@/lib/db');
    db.users.get().push({ id: '1', name: 'Test', email: 'test@test.com', password: 'hash', isAdmin: false });
    const { db: db2 } = await import('@/lib/db');
    expect(db2.users.get()).toHaveLength(1);
    expect(db2.users.get()[0].email).toBe('test@test.com');
  });
});

describe('db orders', () => {
  it('persists across re-imports', async () => {
    const { db } = await import('@/lib/db');
    db.orders.get().push({
      id: 'ORD-1',
      items: [{ productId: 'p1', name: 'Test', price: 100, quantity: 1 }],
      shipping: { name: 'T', email: 't@t.com', phone: '123', address: 'A', city: 'C', state: 'S', zip: 'Z' },
      total: 100,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });
    const { db: db2 } = await import('@/lib/db');
    expect(db2.orders.get()).toHaveLength(1);
    expect(db2.orders.get()[0].id).toBe('ORD-1');
  });
});
