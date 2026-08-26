// @vitest-environment node
//
// Verifica el gate de src/proxy.ts: la cookie de sesión debe validarse
// criptográficamente (firma/claims), no bastar con su presencia.
// Semántica esperada:
//   - Cookie basura / ausente → bloqueo o acceso anónimo (nunca sesión).
//   - Token firmado y vigente → sesión válida.
//   - Token firmado pero vencido → se deja pasar (requireAdmin lo renueva
//     con el refresh token); NO se trata como falsificación.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

let proxyFn: typeof import('@/proxy').proxy;
let signAdminToken: typeof import('@/lib/auth').signAdminToken;
let signUserToken: typeof import('@/lib/auth').signUserToken;
let inspectAdminTokenState: typeof import('@/lib/auth').inspectAdminTokenState;

const BASE = 'https://switchandtech.com';

function makeRequest(path: string, cookies: Record<string, string> = {}): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest(`${BASE}${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

/** true si la respuesta es un "passthrough" del proxy (no redirección). */
function isNext(res: NextResponse): boolean {
  return res.headers.get('x-middleware-next') === '1';
}

async function locationOf(res: NextResponse): Promise<string | null> {
  const loc = res.headers.get('location');
  return loc;
}

beforeAll(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('STORE_DRIVER', 'memory');
  // NODE_ENV queda en 'test': lib/auth usa el fallback de desarrollo,
  // igual que el resto de tests que firman tokens.
  const mod = await import('@/proxy');
  const auth = await import('@/lib/auth');
  proxyFn = mod.proxy;
  signAdminToken = auth.signAdminToken;
  signUserToken = auth.signUserToken;
  inspectAdminTokenState = auth.inspectAdminTokenState;
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('gate de administración (/admin)', () => {
  it('debería_redirigir_a_login_sin_cookie', async () => {
    const res = await proxyFn(makeRequest('/admin/productos'));
    expect(isNext(res)).toBe(false);
    const loc = await locationOf(res);
    expect(loc).toContain('/admin/login');
    expect(loc).toContain('redirect=%2Fadmin%2Fproductos');
  });

  it('debería_bloquear_cookie_falsificada_(firma_inválida)', async () => {
    const res = await proxyFn(
      makeRequest('/admin/productos', { 'admin-token': 'cookie-forjada-sin-firma' })
    );
    expect(isNext(res)).toBe(false);
    expect(await locationOf(res)).toContain('/admin/login');
  });

  it('debería_dejar_pasas_token_admin_válido', async () => {
    const token = await signAdminToken('admin-1');
    const res = await proxyFn(makeRequest('/admin', { 'admin-token': token }));
    expect(isNext(res)).toBe(true);
  });

  it('debería_dejar_pasas_token_vencido_(se_renova_con_refresh_downstream)', async () => {
    const token = await signAdminToken('admin-1');
    // Avanzar el reloj más allá de los 15 min de vigencia del access token
    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + 16 * 60 * 1000);
      expect(await inspectAdminTokenState(token)).toBe('expired');

      const res = await proxyFn(makeRequest('/admin', { 'admin-token': token }));
      expect(isNext(res)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('debería_redirigir_a_panel_desde_/admin/login_con_sesión_válida', async () => {
    const token = await signAdminToken('admin-1');
    const res = await proxyFn(makeRequest('/admin/login', { 'admin-token': token }));
    expect(isNext(res)).toBe(false);
    expect(await locationOf(res)).toBe(`${BASE}/admin`);
  });

  it('debería_mostrar_login_sin_sesión_en_/admin/login', async () => {
    const res = await proxyFn(makeRequest('/admin/login'));
    expect(isNext(res)).toBe(true);
  });
});

describe('bloqueo del admin a la tienda pública', () => {
  it('debería_redirigir_al_panel_solo_con_sesión_admin_real', async () => {
    const token = await signAdminToken('admin-1');
    const res = await proxyFn(makeRequest('/', { 'admin-token': token }));
    expect(isNext(res)).toBe(false);
    expect(await locationOf(res)).toBe(`${BASE}/admin`);
  });

  it('no_debería_tratar_como_admin_una_cookie_falsificada_en_la_tienda', async () => {
    // Cookie forjada navegando la tienda → pasa como visitante anónimo
    const res = await proxyFn(makeRequest('/', { 'admin-token': 'basura' }));
    expect(isNext(res)).toBe(true);
  });

  it('debería_permitir_la_tienda_a_visitantes_anónimos', async () => {
    const res = await proxyFn(makeRequest('/fundas'));
    expect(isNext(res)).toBe(true);
  });
});

describe('rutas de autenticación de clientes', () => {
  it('debería_redirigir_al_inicio_con_sesión_de_cliente_válida', async () => {
    const token = await signUserToken({ id: 'u1', email: 'a@b.co', name: 'A' });
    const res = await proxyFn(
      makeRequest('/iniciar-sesion', { 'auth-token': token })
    );
    expect(isNext(res)).toBe(false);
    expect(await locationOf(res)).toBe(`${BASE}/`);
  });

  it('debería_mostrar_login_con_token_de_cliente_falsificado', async () => {
    const res = await proxyFn(
      makeRequest('/iniciar-sesion', { 'auth-token': 'forjado' })
    );
    expect(isNext(res)).toBe(true);
  });

  it('debería_mostrar_login_para_anónimos_en_/registrarse', async () => {
    const res = await proxyFn(makeRequest('/registrarse'));
    expect(isNext(res)).toBe(true);
  });

  it('un_token_de_usuario_NO_cuenta_como_sesión_admin', async () => {
    // Token de cliente presentado como admin → firma no corresponde
    // al audience de admin → bloqueado en la puerta.
    const userToken = await signUserToken({ id: 'u1', email: 'a@b.co', name: 'A' });
    const res = await proxyFn(
      makeRequest('/admin/productos', { 'admin-token': userToken })
    );
    expect(isNext(res)).toBe(false);
    expect(await locationOf(res)).toContain('/admin/login');
  });
});
