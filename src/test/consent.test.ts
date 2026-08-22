// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

/**
 * Ley 1581 — consentimiento explícito: ni el registro ni el newsletter pueden
 * procesar datos personales sin que el usuario acepte la política de privacidad.
 */

type RegisterRoute = typeof import('@/app/api/auth/register/route');
type NewsletterRoute = typeof import('@/app/api/newsletter/route');
let registerPOST: RegisterRoute['POST'];
let newsletterPOST: NewsletterRoute['POST'];
let resetRateLimitStore: () => void;
let resetStore: () => void;

function makeRequest(path: string, body: unknown, ip = '203.0.113.90'): Request {
  return new Request(`https://switchandtech.com${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://switchandtech.com',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.stubEnv('STORE_DRIVER', 'memory');
  vi.stubEnv('JWT_SECRET', 'test-secret-at-least-32-characters-long!!');

  vi.resetModules();
  const register = await import('@/app/api/auth/register/route');
  const newsletter = await import('@/app/api/newsletter/route');
  const rl = await import('@/lib/rate-limit');
  const store = await import('@/lib/store');

  registerPOST = register.POST;
  newsletterPOST = newsletter.POST;
  resetRateLimitStore = rl.resetRateLimitStore;
  resetStore = store.resetStore;
});

beforeEach(() => {
  const g = globalThis as Record<string, unknown>;
  g.__store_data = undefined;
  g.__adminInitialized = false;
  resetStore();
  resetRateLimitStore();
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/auth/register — consentimiento explícito', () => {
  it('debería_rechazar_registro_sin_consentimiento', async () => {
    const res = await registerPOST(
      makeRequest('/api/auth/register', {
        name: 'Ana',
        email: 'ana@example.com',
        password: 'Clave123!',
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Debes aceptar la política de privacidad');
  });

  it('debería_rechazar_registro_con_consentimiento_false', async () => {
    const res = await registerPOST(
      makeRequest('/api/auth/register', {
        name: 'Ana',
        email: 'ana@example.com',
        password: 'Clave123!',
        consent: false,
      })
    );
    expect(res.status).toBe(400);
  });

  it('debería_crear_el_usuario_con_consentAt_al_aceptar', async () => {
    const res = await registerPOST(
      makeRequest('/api/auth/register', {
        name: 'Ana',
        email: 'ana@example.com',
        password: 'Clave123!',
        consent: true,
      })
    );
    expect(res.status).toBe(201);

    const { db } = await import('@/lib/db');
    const user = (await db.users.get()).find((u) => u.email === 'ana@example.com');
    expect(user).toBeDefined();
    expect(user!.consentAt).toBeTruthy();
    expect(user!.isAdmin).toBe(false);
  });
});

describe('POST /api/newsletter — consentimiento explícito', () => {
  it('debería_rechazar_suscripción_sin_consentimiento', async () => {
    const res = await newsletterPOST(
      makeRequest('/api/newsletter', { email: 'news@example.com' })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Debes aceptar la política de privacidad');
  });

  it('debería_suscribir_con_consentAt_al_aceptar', async () => {
    const res = await newsletterPOST(
      makeRequest('/api/newsletter', { email: 'news@example.com', consent: true })
    );
    expect(res.status).toBe(200);

    const { db } = await import('@/lib/db');
    const sub = (await db.subscribers.get()).find((s) => s.email === 'news@example.com');
    expect(sub).toBeDefined();
    expect(sub!.consentAt).toBeTruthy();
  });
});
