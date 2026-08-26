// @vitest-environment node
import { describe, it, expect, beforeEach, beforeAll, afterEach, afterAll, vi } from 'vitest';

/**
 * POST /api/promos/validate — validación de cupones en el checkout:
 * CSRF, rate limit, zod y respuesta autoritativa del descuento.
 */

type ValidateRoute = typeof import('@/app/api/promos/validate/route');
let validatePOST: ValidateRoute['POST'];
let resetRateLimitStore: () => void;

const BASE = 'https://switchandtech.com';

function makeRequest(body: unknown): Request {
  return new Request(`${BASE}/api/promos/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('STORE_DRIVER', 'memory');

  const route = await import('@/app/api/promos/validate/route');
  validatePOST = route.POST;
});

beforeEach(async () => {
  const g = globalThis as Record<string, unknown>;
  g.__store_data = undefined;
  g.__adminInitialized = false;
  const storeMod = await import('@/lib/store');
  const rlMod = await import('@/lib/rate-limit');
  storeMod.resetStore();
  resetRateLimitStore = rlMod.resetRateLimitStore;
  resetRateLimitStore();

  const db = await import('@/lib/db');
  await db.db.promos.set([
    {
      id: 'promo-1',
      code: 'BIENVENIDA10',
      type: 'percent',
      value: 10,
      minOrder: 50000,
      active: true,
      usageLimit: 3,
      usedCount: 0,
      createdAt: new Date().toISOString(),
    },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/promos/validate', () => {
  it('devuelve_el_descuento_para_un_cupón_válido', async () => {
    const res = await validatePOST(makeRequest({ code: 'bienvenida10', subtotal: 100000 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.discount).toBe(10000);
    expect(data.code).toBe('BIENVENIDA10');
  });

  it('normaliza_el_código_(trim_y_mayúsculas)', async () => {
    const res = await validatePOST(makeRequest({ code: '  bienvenida10 ', subtotal: 100000 }));
    const data = await res.json();
    expect(data.valid).toBe(true);
  });

  it('rechaza_cupón_inexistente_sin_error_http', async () => {
    const res = await validatePOST(makeRequest({ code: 'NOEXISTE', subtotal: 100000 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBeTruthy();
  });

  it('rechaza_subtotal_bajo_el_mínimo_de_compra', async () => {
    const res = await validatePOST(makeRequest({ code: 'BIENVENIDA10', subtotal: 10000 }));
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toMatch(/Compra mínima/);
  });

  it('400_con_payload_inválido_(zod)', async () => {
    const res = await validatePOST(makeRequest({ code: 'AB', subtotal: -5 }));
    expect(res.status).toBe(400);
  });

  it('403_sin_cabecera_Origin_(CSRF)', async () => {
    const res = await validatePOST(
      new Request(`${BASE}/api/promos/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'BIENVENIDA10', subtotal: 100000 }),
      })
    );
    expect(res.status).toBe(403);
  });

  it('429_al_exceder_el_rate_limit_de_la_ruta', async () => {
    // maxRequests: 10 en esta ruta
    for (let i = 0; i < 10; i++) {
      await validatePOST(makeRequest({ code: 'NOEXISTE', subtotal: 100000 }));
    }
    const over = await validatePOST(makeRequest({ code: 'NOEXISTE', subtotal: 100000 }));
    expect(over.status).toBe(429);
  });
});
