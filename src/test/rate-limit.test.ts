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
  it('debería_priorizar_x-real-ip_sobre_x-forwarded-for', () => {
    const request = new Request('http://localhost:3000/api/x', {
      headers: {
        'x-real-ip': '198.51.100.9',
        'x-forwarded-for': '203.0.113.5, 70.41.3.18',
      },
    });
    expect(rateLimitKey(request)).toContain('198.51.100.9');
  });

  it('debería_usar_el_último_salto_de_x-forwarded-for', () => {
    // Los primeros saltos pueden ser spoofeados por el cliente; el último es
    // el añadido por el proxy de confianza.
    const request = new Request('http://localhost:3000/api/x', {
      headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18' },
    });
    expect(rateLimitKey(request)).toContain('70.41.3.18');
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

  function stubPipeline(replies: Array<{ result?: unknown; error?: string }>) {
    return stubFetch(async (fetchUrl: string) => {
      if (!String(fetchUrl).includes('/pipeline')) throw new Error(`URL inesperada: ${fetchUrl}`);
      return new Response(JSON.stringify(replies), { status: 200 });
    });
  }

  it('debería_incrementar_de_forma_atómica_via_pipeline', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    const fetchMock = stubPipeline([{ result: 2 }, { result: 'OK' }, { result: 55_000 }]);

    const result = await store.increment('clave', 60_000);

    expect(result).toEqual({ count: 2, resetAt: expect.any(Number) });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://upstash.example.com/pipeline',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      })
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as string[][];
    expect(body[0]).toEqual(['INCR', 'clave']);
    expect(body[1]).toEqual(['EXPIRE', 'clave', '60', 'NX']);
    expect(body[2]).toEqual(['PTTL', 'clave']);
  });

  it('debería_derivar_resetAt_del_pttl_restante', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    stubPipeline([{ result: 1 }, { result: 'OK' }, { result: 30_000 }]);

    const result = await store.increment('clave', 60_000);

    expect(result.resetAt).toBe(Date.now() + 30_000);
  });

  it('debería_rearmar_ttl_cuando_pttl_indica_clave_sin_expiracion', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    const fetchMock = stubFetch((fetchUrl: string) => {
      if (String(fetchUrl).includes('/pipeline')) {
        return new Response(JSON.stringify([{ result: 3 }, { result: 0 }, { result: -1 }]), { status: 200 });
      }
      if (String(fetchUrl).includes('/expire/')) {
        return jsonResponse('OK');
      }
      throw new Error(`URL inesperada: ${fetchUrl}`);
    });

    const result = await store.increment('clave', 60_000);

    expect(result.count).toBe(3);
    expect(String(fetchMock.mock.calls.find(([u]) => String(u).includes('/expire/'))?.[0])).toContain(
      '/expire/clave/60'
    );
  });

  it('debería_abrir_el_paso_si_upstash_responde_error_http (fail-open)', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    stubFetch(() => new Response('', { status: 401 }));

    await expect(store.increment('clave', 60_000)).resolves.toEqual({
      count: 0,
      resetAt: expect.any(Number),
    });
  });

  it('debería_abrir_el_paso_si_falla_la_red (fail-open)', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    stubFetch(() => {
      throw new Error('network down');
    });

    await expect(store.increment('clave', 60_000)).resolves.toEqual({
      count: 0,
      resetAt: expect.any(Number),
    });
  });

  it('debería_abrir_el_paso_con_respuesta_invalida (fail-open)', async () => {
    const store = new UpstashRateLimitStore('https://upstash.example.com', 'token');
    stubPipeline([{ result: null }, { error: 'ERR' }, {}]);

    await expect(store.increment('clave', 60_000)).resolves.toEqual({
      count: 0,
      resetAt: expect.any(Number),
    });
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
