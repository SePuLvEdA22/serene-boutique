// @vitest-environment node
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';

/**
 * GET /api/orders — órdenes del usuario autenticado:
 * - anónimo → 200 {orders: []}
 * - usuario → solo SUS órdenes, más recientes primero
 * - excepción del repositorio → 500 (no se enmascara como "sin órdenes")
 */

vi.mock('@/lib/session', () => ({ getSessionUser: vi.fn() }));

type OrdersRoute = typeof import('@/app/api/orders/route');
let ordersGET: OrdersRoute['GET'];
let getSessionUser: ReturnType<typeof vi.fn>;

const ORDER_BASE = {
  items: [{ productId: 'p1', name: 'Funda', price: 1000, quantity: 1 }],
  shipping: { name: 'T', email: 't@t.com', phone: '123', address: 'A', city: 'C', state: 'S', zip: 'Z' },
  paymentMethod: 'card' as const,
};

async function seedOrder(id: string, userId: string | undefined, createdAt: string) {
  const repo = (await import('@/lib/repositories')).getOrderRepo();
  await repo.create({ ...ORDER_BASE, id, userId, total: 1000, status: 'pending', createdAt });
}

beforeAll(async () => {
  vi.stubEnv('STORE_DRIVER', 'memory');
  ordersGET = (await import('@/app/api/orders/route')).GET;
});

beforeEach(async () => {
  const sessionMod = await import('@/lib/session');
  getSessionUser = sessionMod.getSessionUser as ReturnType<typeof vi.fn>;
  getSessionUser.mockReset();

  // El singleton db queda ligado al primer store: limpiar por colección.
  const db = await import('@/lib/db');
  await db.db.orders.set([]);
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GET /api/orders', () => {
  it('anónimo_recibe_lista_vacía_con_200', async () => {
    getSessionUser.mockResolvedValue(null);
    await seedOrder('ORD-1', 'u-1', new Date().toISOString());

    const res = await ordersGET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ orders: [] });
  });

  it('devuelve_solo_las_órdenes_del_usuario,_más_recientes_primero', async () => {
    getSessionUser.mockResolvedValue({ id: 'u-1', name: 'Ana', email: 'a@b.co', isAdmin: false });

    const old = new Date('2026-01-01T00:00:00.000Z').toISOString();
    const mid = new Date('2026-05-01T00:00:00.000Z').toISOString();
    const recent = new Date('2026-08-01T00:00:00.000Z').toISOString();
    await seedOrder('ORD-VIEJA', 'u-1', old);
    await seedOrder('ORD-OTRO', 'u-2', mid);
    await seedOrder('ORD-NUEVA', 'u-1', recent);

    const res = await ordersGET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orders.map((o: { id: string }) => o.id)).toEqual(['ORD-NUEVA', 'ORD-VIEJA']);
  });

  it('un_error_interno_responde_500_(no_se_enmascara_como_lista_vacía)', async () => {
    getSessionUser.mockResolvedValue({ id: 'u-1', name: 'Ana', email: 'a@b.co', isAdmin: false });

    const repo = (await import('@/lib/repositories')).getOrderRepo();
    vi.spyOn(repo, 'findByUser').mockRejectedValueOnce(new Error('DB caída'));

    const res = await ordersGET();
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });
});
