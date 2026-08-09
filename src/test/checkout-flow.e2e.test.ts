import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createHmac } from 'node:crypto';

/**
 * Prueba e2e (integración a nivel de handler) del flujo de checkout:
 *
 *   carrito → POST /api/mercadopago/create-preference → POST /api/mercadopago/webhook → estado de la orden
 *
 * Objetivo: validar que las protecciones añadidas (CSRF + rate limiting)
 * NO rompen el flujo real de compra, pero sí bloquean abuso.
 *
 * - Se invocan los route handlers reales con objetos Request reales.
 * - Se simula la API de MercadoPago con un fetch global mockeado.
 * - El payload del carrito replica lo que construye `checkout/page.tsx`.
 * - El webhook se firma con HMAC-SHA256 (como lo hace MercadoPago en producción).
 */

const WEBHOOK_SECRET = 'e2e-webhook-secret';

// Tipos de los módulos de rutas (importados dinámicamente tras configurar env)
type CreatePreferenceRoute = typeof import('@/app/api/mercadopago/create-preference/route');
type WebhookRoute = typeof import('@/app/api/mercadopago/webhook/route');
type PublicOrderRoute = typeof import('@/app/api/orders/[id]/route');
let createPreferencePOST: CreatePreferenceRoute['POST'];
let webhookPOST: WebhookRoute['POST'];
let publicOrderGET: PublicOrderRoute['GET'];
let getOrderRepo: (typeof import('@/lib/repositories').getOrderRepo);
let resetRateLimitStore: () => void;
let resetStore: () => void;

/** orderId capturado de create-preference, usado como external_reference por el mock de MP. */
let lastOrderId = '';

/** external_reference que el mock de MP captura del body de la preferencia. */
let lastExternalReference = '';

// ─── Helpers ─────────────────────────────────────────────────────────

function buildCheckoutPayload() {
  return {
    items: [
      { id: 'funda-iphone-15', title: 'Funda iPhone 15', quantity: 2, unit_price: 249 },
      { id: 'cargador-20w', title: 'Cargador 20W', quantity: 1, unit_price: 399 },
    ],
    paymentMethod: 'card',
    shipping: {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '5551234567',
      address: 'Av. Siempre Viva 123',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zip: '01000',
      notes: 'Entregar en recepción',
    },
  };
}

function makeApiRequest(
  path: string,
  opts: { origin?: string; ip?: string; body?: unknown } = {}
): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.origin) headers['Origin'] = opts.origin;
  if (opts.ip) headers['x-forwarded-for'] = opts.ip;

  return new Request(`https://switchandtech.com${path}`, {
    method: 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

function makeWebhookRequest(paymentId: number, requestId: string, ts: number, v1: string): Request {
  return new Request('https://switchandtech.com/api/mercadopago/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': `ts=${ts},v1=${v1}`,
      'x-request-id': requestId,
    },
    body: JSON.stringify({ type: 'payment', action: 'payment.created', data: { id: paymentId } }),
  });
}

function signWebhook(paymentId: number, requestId: string, ts: number): string {
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  return createHmac('sha256', WEBHOOK_SECRET).update(manifest).digest('hex');
}

/** Mock de la API de MercadoPago: create-preference y consulta de pago (approved). */
function mockMpFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/checkout/preferences')) {
        // Capturar el external_reference que nuestra preferencia envía (como lo
        // haría MercadoPago real al devolverlo en el pago).
        if (init?.body) {
          try {
            const body = JSON.parse(String(init.body)) as { external_reference?: string };
            lastExternalReference = body.external_reference || '';
          } catch {
            lastExternalReference = '';
          }
        }
        return new Response(
          JSON.stringify({
            id: 'PREF-123',
            init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=PREF-123',
            sandbox_init_point:
              'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=PREF-123',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/v1/payments/')) {
        return new Response(
          JSON.stringify({
            id: 123456,
            status: 'approved',
            status_detail: 'accredited',
            external_reference: lastExternalReference || lastOrderId,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response('{}', { status: 404 });
    })
  );
}

beforeAll(async () => {
  // Silenciar logs esperados de las rutas durante el test.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  // Simular entorno de producción de MercadoPago ANTES de importar los módulos
  // (los handlers leen las variables a nivel de módulo).
  vi.stubEnv('STORE_DRIVER', 'memory');
  vi.stubEnv('MP_ACCESS_TOKEN', 'APP_USR-test-access-token');
  vi.stubEnv('NEXT_PUBLIC_MP_PUBLIC_KEY', 'APP_USR-test-public-key');
  vi.stubEnv('MP_WEBHOOK_SECRET', WEBHOOK_SECRET);
  mockMpFetch();

  vi.resetModules();
  const createPref = await import('@/app/api/mercadopago/create-preference/route');
  const webhook = await import('@/app/api/mercadopago/webhook/route');
  const publicOrder = await import('@/app/api/orders/[id]/route');
  const repos = await import('@/lib/repositories');
  const rl = await import('@/lib/rate-limit');
  const store = await import('@/lib/store');

  createPreferencePOST = createPref.POST;
  webhookPOST = webhook.POST;
  publicOrderGET = publicOrder.GET;
  getOrderRepo = repos.getOrderRepo;
  resetRateLimitStore = rl.resetRateLimitStore;
  resetStore = store.resetStore;
});

beforeEach(() => {
  // Limpiar store y rate limiter entre tests (mismo protocolo que db.test.ts).
  const g = globalThis as Record<string, unknown>;
  g.__store_data = undefined;
  g.__adminInitialized = false;
  resetStore();
  resetRateLimitStore();
  lastOrderId = '';
  lastExternalReference = '';
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────

describe('flujo de checkout completo (carrito → preferencia → webhook → orden)', () => {
  it('debería_crear_preferencia_y_confirmar_la_orden_al_recibir_webhook_firmado', async () => {
    // 1) El frontend (checkout/page.tsx) envía el carrito a create-preference
    const res = await createPreferencePOST(
      makeApiRequest('/api/mercadopago/create-preference', {
        origin: 'https://switchandtech.com',
        ip: '203.0.113.10',
        body: buildCheckoutPayload(),
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.orderId).toBeTruthy();
    expect(data.preference?.init_point).toContain('mercadopago.com');
    lastOrderId = data.orderId;

    // La preferencia debe enviar external_reference = id de la orden para que el
    // webhook pueda correlacionar el pago con la orden.
    expect(lastExternalReference).toBe(data.orderId);

    // 2) La orden se crea en estado "pending" con los items del carrito
    const pending = getOrderRepo().findById(lastOrderId);
    expect(pending).toBeDefined();
    expect(pending!.status).toBe('pending');
    expect(pending!.items).toHaveLength(2);
    expect(pending!.total).toBe(249 * 2 + 399);
    expect(pending!.paymentMethod).toBe('card');

    // 3) MercadoPago notifica el pago aprobado con firma válida (sin Origin: server-to-server)
    const paymentId = 123456;
    const requestId = 'req-abc-123';
    const ts = Math.floor(Date.now() / 1000);
    const v1 = signWebhook(paymentId, requestId, ts);

    const webhookRes = await webhookPOST(makeWebhookRequest(paymentId, requestId, ts, v1));
    expect(webhookRes.status).toBe(200);

    // 4) La orden cambia a "confirmed"
    const updated = getOrderRepo().findById(lastOrderId);
    expect(updated!.status).toBe('confirmed');
  });

  it('debería_la_ruta_pública_de_orden_devolver_el_detalle_al_cliente', async () => {
    // Crear una orden como en producción
    const created = await createPreferencePOST(
      makeApiRequest('/api/mercadopago/create-preference', {
        origin: 'https://switchandtech.com',
        ip: '203.0.113.30',
        body: buildCheckoutPayload(),
      })
    );
    expect(created.status).toBe(200);
    const { orderId } = await created.json();

    // El cliente (sin sesión de admin) consulta su orden vía ruta pública
    const res = await publicOrderGET(
      new Request(`https://switchandtech.com/api/orders/${orderId}`, {
        headers: { 'x-forwarded-for': '203.0.113.31' },
      }),
      { params: Promise.resolve({ id: orderId }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.id).toBe(orderId);
    expect(data.order.items).toHaveLength(2);
    expect(data.order.total).toBe(249 * 2 + 399);
    expect(data.order.status).toBe('pending');
  });

  it('debería_la_ruta_pública_no_exponer_datos_personales_ni_de_envío', async () => {
    // Crear una orden con PSE (incluye identificación del pagador)
    const created = await createPreferencePOST(
      makeApiRequest('/api/mercadopago/create-preference', {
        origin: 'https://switchandtech.com',
        ip: '203.0.113.40',
        body: {
          ...buildCheckoutPayload(),
          paymentMethod: 'pse',
          payer: {
            name: 'Juan Pérez',
            email: 'juan@example.com',
            identification: { type: 'CC', number: '1018456789' },
          },
        },
      })
    );
    expect(created.status).toBe(200);
    const { orderId } = await created.json();

    const res = await publicOrderGET(
      new Request(`https://switchandtech.com/api/orders/${orderId}`, {
        headers: { 'x-forwarded-for': '203.0.113.41' },
      }),
      { params: Promise.resolve({ id: orderId }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();

    // Debe incluir los campos de la página de confirmación
    expect(data.order.id).toBe(orderId);
    expect(data.order.total).toBeGreaterThan(0);
    expect(data.order.status).toBeTruthy();

    // NO debe exponer datos personales ni de envío
    expect(data.order.payerIdentification).toBeUndefined();
    expect(data.order.shipping).toBeUndefined();
    expect(data.order.userId).toBeUndefined();
    expect(data.order.mpPaymentId).toBeUndefined();
    expect(data.order.mpPreferenceId).toBeUndefined();
  });

  it('debería_la_ruta_pública_rechazar_ids_inválidos_y_no_encontrados', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.32' };

    // ID que no parece una orden → 404
    const bad = await publicOrderGET(
      new Request('https://switchandtech.com/api/orders/foo', { headers }),
      { params: Promise.resolve({ id: 'foo' }) }
    );
    expect(bad.status).toBe(404);

    // ID con formato de orden pero inexistente → 404
    const missing = await publicOrderGET(
      new Request('https://switchandtech.com/api/orders/ORD-NOPE-123', { headers }),
      { params: Promise.resolve({ id: 'ORD-NOPE-123' }) }
    );
    expect(missing.status).toBe(404);
  });

  it('debería_rechazar_webhook_con_firma_inválida_sin_cambiar_el_estado_de_la_orden', async () => {
    // Crear una orden pendiente real primero
    const created = await createPreferencePOST(
      makeApiRequest('/api/mercadopago/create-preference', {
        origin: 'https://switchandtech.com',
        ip: '203.0.113.20',
        body: buildCheckoutPayload(),
      })
    );
    expect(created.status).toBe(200);
    const { orderId } = await created.json();
    lastOrderId = orderId;

    // Webhook con firma inválida (misma longitud, contenido distinto)
    const paymentId = 123456;
    const requestId = 'req-invalida';
    const ts = Math.floor(Date.now() / 1000);
    const badV1 = 'deadbeef'.padEnd(64, '0');

    const res = await webhookPOST(makeWebhookRequest(paymentId, requestId, ts, badV1));
    expect(res.status).toBe(401);

    // La orden NO debe cambiar de estado: sigue pendiente
    const order = getOrderRepo().findById(orderId);
    expect(order!.status).toBe('pending');
  });
});

describe('CSRF no rompe el flujo válido pero bloquea orígenes inválidos', () => {
  it('debería_aceptar_origen_válido_y_bloquear_sin_origen_o_con_origen_malicioso', async () => {
    const path = '/api/mercadopago/create-preference';
    const ip = '203.0.113.11';

    // Sin Origin (petición cross-site) → 403
    const noOrigin = await createPreferencePOST(
      makeApiRequest(path, { ip, body: buildCheckoutPayload() })
    );
    expect(noOrigin.status).toBe(403);

    // Origin con dominio malicioso que comparte prefijo → 403
    const evilOrigin = await createPreferencePOST(
      makeApiRequest(path, { origin: 'https://switchandtech.com.evil.com', ip, body: buildCheckoutPayload() })
    );
    expect(evilOrigin.status).toBe(403);

    // Origin válido (mismo origen, como un navegador real) → el flujo NO se rompe
    const ok = await createPreferencePOST(
      makeApiRequest(path, { origin: 'https://switchandtech.com', ip, body: buildCheckoutPayload() })
    );
    expect(ok.status).toBe(200);
  });
});

describe('rate limiting no rompe el flujo normal pero bloquea abuso', () => {
  it('debería_permitir_dentro_del_límite_y_devolver_429_al_exceder', async () => {
    const path = '/api/mercadopago/create-preference';
    const origin = 'https://switchandtech.com';
    const ip = '203.0.113.50';

    // Nota: "10" refleja maxRequests: 10 de create-preference (ver route.ts).
    // Si se ajusta el límite, actualizar también este test.
    // 10 solicitudes legítimas (límite configurado) → todas OK
    for (let i = 0; i < 10; i++) {
      const res = await createPreferencePOST(
        makeApiRequest(path, { origin, ip, body: buildCheckoutPayload() })
      );
      expect(res.status).toBe(200);
    }

    // La 11ª (misma IP, misma ruta) → 429
    const over = await createPreferencePOST(
      makeApiRequest(path, { origin, ip, body: buildCheckoutPayload() })
    );
    expect(over.status).toBe(429);

    // Tras el reinicio del contador (nueva ventana / instancia), el flujo vuelve a funcionar
    resetRateLimitStore();
    const again = await createPreferencePOST(
      makeApiRequest(path, { origin, ip, body: buildCheckoutPayload() })
    );
    expect(again.status).toBe(200);
  });

  it('debería_no_afectar_a_un_ip_distinto', async () => {
    const path = '/api/mercadopago/create-preference';
    const origin = 'https://switchandtech.com';

    // Saturar el límite de una IP
    for (let i = 0; i < 10; i++) {
      await createPreferencePOST(
        makeApiRequest(path, { origin, ip: '203.0.113.60', body: buildCheckoutPayload() })
      );
    }
    expect(
      (await createPreferencePOST(
        makeApiRequest(path, { origin, ip: '203.0.113.60', body: buildCheckoutPayload() })
      )).status
    ).toBe(429);

    // Otra IP no se ve afectada
    const other = await createPreferencePOST(
      makeApiRequest(path, { origin, ip: '198.51.100.7', body: buildCheckoutPayload() })
    );
    expect(other.status).toBe(200);
  });
});
