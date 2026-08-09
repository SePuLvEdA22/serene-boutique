// @vitest-environment node
//
// Entorno node (no jsdom): jose (JWT) exige que TextEncoder y Uint8Array
// compartan el mismo ámbito; en jsdom son cross-realm y el sign falla con
// "payload must be an instance of Uint8Array". En producción no hay jsdom.
import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import bcrypt from 'bcryptjs';

/**
 * Prueba del flujo de autenticación de clientes:
 *
 *   POST /api/auth/login
 *
 * Objetivo: garantizar que una cuenta con `isAdmin: true` (el mismo usuario
 * que usa el panel en /admin/login) al iniciar sesión desde la tienda:
 *
 * 1. Devuelve `isAdmin: true` en la respuesta.
 * 2. Establece la cookie `admin-token` además de `auth-token`
 *    (el proxy usa `admin-token` para redirigir al panel).
 *
 * Y que una cuenta normal NO recibe `admin-token` ni `isAdmin`.
 */

type AuthLoginRoute = typeof import('@/app/api/auth/login/route');
type AuthLogoutRoute = typeof import('@/app/api/auth/logout/route');
let loginPOST: AuthLoginRoute['POST'];
let logoutPOST: AuthLogoutRoute['POST'];
let resetRateLimitStore: () => void;
let resetStore: () => void;

function makeLoginRequest(body: { email: string; password: string }, ip = '203.0.113.70'): Request {
  return new Request('https://switchandtech.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://switchandtech.com',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

function setCookieHeaders(res: Response): string[] {
  const raw = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  return raw.length > 0 ? raw : [res.headers.get('set-cookie') || ''].filter(Boolean);
}

function cookieNames(res: Response): string[] {
  return setCookieHeaders(res).map((c) => c.split('=')[0]);
}

beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.stubEnv('STORE_DRIVER', 'memory');
  vi.stubEnv('JWT_SECRET', 'test-secret-at-least-32-characters-long!!');

  vi.resetModules();
  const login = await import('@/app/api/auth/login/route');
  const logout = await import('@/app/api/auth/logout/route');
  const rl = await import('@/lib/rate-limit');
  const store = await import('@/lib/store');

  loginPOST = login.POST;
  logoutPOST = logout.POST;
  resetRateLimitStore = rl.resetRateLimitStore;
  resetStore = store.resetStore;
});

beforeEach(async () => {
  const g = globalThis as Record<string, unknown>;
  g.__store_data = undefined;
  g.__adminInitialized = false;
  resetStore();
  resetRateLimitStore();

  // Sembrar un admin y un cliente directamente en el store singleton.
  const { db } = await import('@/lib/db');
  db.users.set([
    {
      id: 'admin-1',
      name: 'Administrador',
      email: 'admin@switchandtech.mx',
      password: bcrypt.hashSync('admin123', 4),
      isAdmin: true,
    },
    {
      id: 'user-1',
      name: 'Cliente',
      email: 'cliente@example.com',
      password: bcrypt.hashSync('clave123', 4),
      isAdmin: false,
    },
  ]);
});

describe('POST /api/auth/login con cuenta de administrador', () => {
  it('debería_devolver_isAdmin_true_y_establecer_admin-token', async () => {
    const res = await loginPOST(
      makeLoginRequest({ email: 'admin@switchandtech.mx', password: 'admin123' })
    );

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isAdmin).toBe(true);
    expect(data.user.isAdmin).toBe(true);

    const cookies = cookieNames(res);
    expect(cookies).toContain('auth-token');
    expect(cookies).toContain('admin-token');
  });

  it('debería_devolver_isAdmin_false_sin_admin-token_para_un_cliente_normal', async () => {
    const res = await loginPOST(
      makeLoginRequest({ email: 'cliente@example.com', password: 'clave123' })
    );

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isAdmin).toBe(false);
    expect(data.user.isAdmin).toBe(false);

    const cookies = cookieNames(res);
    expect(cookies).toContain('auth-token');
    expect(cookies).not.toContain('admin-token');
  });

  it('debería_rechazar_credenciales_inválidas_con_401', async () => {
    const res = await loginPOST(
      makeLoginRequest({ email: 'admin@switchandtech.mx', password: 'incorrecta' })
    );
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('debería_limpiar_auth-token_y_admin-token_para_no_quedar_atrapado_en_el_panel', async () => {
    const res = await logoutPOST(
      new Request('https://switchandtech.com/api/auth/logout', {
        method: 'POST',
        headers: { Origin: 'https://switchandtech.com' },
      })
    );
    expect(res.status).toBe(200);

    const cookies = cookieNames(res);
    expect(cookies).toContain('auth-token');
    expect(cookies).toContain('admin-token');
  });
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
