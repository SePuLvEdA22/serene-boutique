import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkRateLimit,
  checkRouteRateLimit,
  rateLimitKey,
  resetRateLimitStore,
  UpstashRateLimitStore,
} from '@/lib/rate-limit';

function jsonResponse(result: unknown): Response {
  return new Response(JSON.stringify({ result }), { status: 200 });
}

function stubFetch(handler: (url: string) => Promise<Response> | Response) {
  const fetchMock = vi.fn(handler);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function makeRequest(url = 'http://localhost:3000/api/auth/login', ip = '1.2.3.4') {
  return new Request(url, {
    headers: ip ? { 'x-forwarded-for': ip } : {},
  });
}

beforeEach(() => {
  resetRateLimitStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  it('debería_permitir_peticiones_dentro_del_límite', async () => {
    const options = { maxRequests: 3, windowMs: 60_000 };
    expect((await checkRateLimit('k', options)).allowed).toBe(true);
    expect((await checkRateLimit('k', options)).allowed).toBe(true);
    expect((await checkRateLimit('k', options)).allowed).toBe(true);
  });

  it('debería_bloquear_al_superar_el_límite', async () => {
    const options = { maxRequests: 2, windowMs: 60_000 };
    await checkRateLimit('k', options);
    const second = await checkRateLimit('k', options);
    expect(second.allowed).toBe(true);
    const third = await checkRateLimit('k', options);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('debería_reiniciar_el_contador_al_vencer_la_ventana', async () => {
    vi.useFakeTimers();
    const options = { maxRequests: 1, windowMs: 60_000 };
    const first = await checkRateLimit('k', options);
    expect(first.allowed).toBe(true);

    const blocked = await checkRateLimit('k', options);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    const afterWindow = await checkRateLimit('k', options);
    expect(afterWindow.allowed).toBe(true);
  });

  it('debería_tratar_claves_distintas_de_forma_independiente', async () => {
    const options = { maxRequests: 1, windowMs: 60_000 };
    await checkRateLimit('ip-a:path', options);
    expect((await checkRateLimit('ip-b:path', options)).allowed).toBe(true);
  });

  it('debería_reportar_remaining_correcto', async () => {
    const options = { maxRequests: 5, windowMs: 60_000 };
    const first = await checkRateLimit('k', options);
    expect(first.remaining).toBe(4);
  });
});

describe('rateLimitKey', () => {
  it('debería_usar_la_primera_ip_de_x-forwarded-for', () => {
    const request = new Request('http://localhost:3000/api/x', {
      headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18' },
    });
    expect(rateLimitKey(request)).toContain('203.0.113.5');
  });

  it('debería_incluir_la_ruta_en_la_clave', () => {
    const key = rateLimitKey(makeRequest('http://localhost:3000/api/auth/login'));
    expect(key).toContain('/api/auth/login');
  });

  it('debería_usar_anonymous_si_no_hay_header_de_ip', () => {
    const key = rateLimitKey(makeRequest('http://localhost:3000/api/x', ''));
    expect(key).toContain('anonymous');
  });
});

describe('UpstashRateLimitStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('debería_escribir_y_leer_entradas_via_REST', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    const entry = { count: 2, resetAt: Date.now() + 60_000 };

    const fetchMock = stubFetch((url: string) => {
      if (url.startsWith('https://upstash.example.com/get/')) {
        return jsonResponse(JSON.stringify(entry));
      }
      return jsonResponse('OK');
    });

    await store.set('clave', entry, 60_000);
    const stored = await store.get('clave');

    expect(stored).toEqual(entry);
    const setCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/set/'));
    expect(setCall).toBeTruthy();
    expect(String(setCall?.[0])).toContain('EX=60');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/get/'),
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
    );
  });

  it('debería_devolver_undefined_cuando_no_hay_resultado', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    stubFetch(() => jsonResponse(null));

    await expect(store.get('clave')).resolves.toBeUndefined();
  });

  it('debería_devolver_undefined_con_json_malformado', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    stubFetch(() => jsonResponse('{no-json'));

    await expect(store.get('clave')).resolves.toBeUndefined();
  });

  it('debería_abrir_el_paso_si_falla_la_red (fail-open)', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    stubFetch(() => {
      throw new Error('network down');
    });

    await expect(store.get('clave')).resolves.toBeUndefined();
    await expect(store.set('clave', { count: 1, resetAt: Date.now() + 60_000 }, 60_000)).resolves.toBeUndefined();
  });
});

describe('checkRouteRateLimit (presupuesto global por IP)', () => {
  it('debería_compartir_presupuesto_global_entre_rutas_del_mismo_ip', async () => {
    const routeOptions = { maxRequests: 5, windowMs: 60_000 };
    const globalOptions = { maxRequests: 2, windowMs: 60_000 };

    const r1 = await checkRouteRateLimit(
      makeRequest('http://localhost:3000/api/a'),
      routeOptions,
      globalOptions
    );
    expect(r1.allowed).toBe(true);

    const r2 = await checkRouteRateLimit(
      makeRequest('http://localhost:3000/api/b'),
      routeOptions,
      globalOptions
    );
    expect(r2.allowed).toBe(true);

    // La tercera llamada (aunque sea otra ruta) excede el presupuesto global
    const r3 = await checkRouteRateLimit(
      makeRequest('http://localhost:3000/api/c'),
      routeOptions,
      globalOptions
    );
    expect(r3.allowed).toBe(false);
  });

  it('debería_no_afectar_a_ips_distintas', async () => {
    const routeOptions = { maxRequests: 5, windowMs: 60_000 };
    const globalOptions = { maxRequests: 1, windowMs: 60_000 };

    const r1 = await checkRouteRateLimit(
      makeRequest('http://localhost:3000/api/a', '1.1.1.1'),
      routeOptions,
      globalOptions
    );
    expect(r1.allowed).toBe(true);

    const r2 = await checkRouteRateLimit(
      makeRequest('http://localhost:3000/api/a', '2.2.2.2'),
      routeOptions,
      globalOptions
    );
    expect(r2.allowed).toBe(true);
  });
});
