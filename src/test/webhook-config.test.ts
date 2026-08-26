// @vitest-environment node
//
// Verifica el fail-fast de configuración del webhook de MercadoPago:
// en producción con credenciales reales (APP_USR-), procesar una
// notificación de pago sin MP_WEBHOOK_SECRET sería un bypass — la ruta
// debe rechazarla con 503 en vez de verificarla "opcionalmente".

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

type WebhookRoute = typeof import('@/app/api/mercadopago/webhook/route');

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makePaymentNotification(): Request {
  return new Request('https://switchandtech.com/api/mercadopago/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'payment',
      action: 'payment.created',
      data: { id: 123456 },
    }),
  });
}

function makeTestPing(): Request {
  return new Request('https://switchandtech.com/api/mercadopago/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'test', data: {} }),
  });
}

async function importRoute(): Promise<WebhookRoute['POST']> {
  vi.resetModules();
  const route = await import('@/app/api/mercadopago/webhook/route');
  return route.POST;
}

describe('fail-fast de MP_WEBHOOK_SECRET en el webhook', () => {
  it('debería_rechazar_con_503_en_producción_sin_secret_y_credenciales_reales', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STORE_DRIVER', 'memory');
    // Credenciales de producción → modo real (isTestMode = false)
    vi.stubEnv('NEXT_PUBLIC_MP_PUBLIC_KEY', 'APP_USR-prod-public-key');
    vi.stubEnv('MP_ACCESS_TOKEN', 'APP_USR-prod-access-token');
    vi.stubEnv('MP_WEBHOOK_SECRET', '');

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const POST = await importRoute();
    const res = await POST(makePaymentNotification());

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toMatch(/mal configurado/);
    // No debe intentar consultar la API de MP: la notificación se descarta.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('debería_aceptar_ping_de_prueba_aunque_falte_el_secret', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STORE_DRIVER', 'memory');
    vi.stubEnv('NEXT_PUBLIC_MP_PUBLIC_KEY', 'APP_USR-prod-public-key');
    vi.stubEnv('MP_WEBHOOK_SECRET', '');

    const POST = await importRoute();
    const res = await POST(makeTestPing());

    expect(res.status).toBe(200);
  });

  it('debería_mantener_comportamiento_tolerante_en_desarrollo_sin_secret', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('STORE_DRIVER', 'memory');
    // Modo test: sin public key de producción ni access token
    vi.stubEnv('NEXT_PUBLIC_MP_PUBLIC_KEY', '');
    vi.stubEnv('MP_ACCESS_TOKEN', '');
    vi.stubEnv('MP_WEBHOOK_SECRET', '');

    const POST = await importRoute();
    const res = await POST(makePaymentNotification());

    // Dev/test: acepta sin verificar (no actualiza ninguna orden)
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it('debería_aceptar_notificación_en_producción_con_secret_configurado', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('STORE_DRIVER', 'memory');
    vi.stubEnv('NEXT_PUBLIC_MP_PUBLIC_KEY', 'APP_USR-prod-public-key');
    vi.stubEnv('MP_ACCESS_TOKEN', 'APP_USR-prod-access-token');
    vi.stubEnv('MP_WEBHOOK_SECRET', 'un-secreto-de-webhook-configurado');

    // Sin firma válida → pasa el fail-fast pero rechaza con 401
    const POST = await importRoute();
    const res = await POST(makePaymentNotification());

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Firma inválida/);
  });
});
