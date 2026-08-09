/**
 * Rate limiting con almacenes intercambiables.
 *
 * - Por defecto usa un `Map` en memoria (útil en desarrollo y tests).
 * - Si se configuran `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`,
 *   usa Upstash Redis (REST) para compartir el estado entre instancias
 *   serverless (requisito para que el límite funcione en Vercel).
 * - Incluye un presupuesto global por IP para evitar el bypass por
 *   dispersión entre rutas (rotar de endpoint para eludir cada límite).
 */

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | undefined>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
}

// ─── Almacén en memoria ──────────────────────────────────────────────

class MemoryRateLimitStore implements RateLimitStore {
  private readonly store = new Map<string, RateLimitEntry>();
  private static readonly MAX_ENTRIES = 10_000;

  async get(key: string): Promise<RateLimitEntry | undefined> {
    return this.store.get(key);
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    // Poda oportunista: evita crecimiento ilimitado con claves únicas (ip:ruta).
    if (this.store.size >= MemoryRateLimitStore.MAX_ENTRIES) {
      const now = Date.now();
      for (const [k, e] of this.store) {
        if (now > e.resetAt) this.store.delete(k);
      }
    }
    this.store.set(key, entry);
  }

  clear(): void {
    this.store.clear();
  }
}

// ─── Almacén distribuido (Upstash Redis REST) ────────────────────────

/**
 * Almacén distribuido sobre la API REST de Upstash Redis.
 *
 * ⚠️ Limitación conocida: get→incrementar→set NO es atómico; bajo mucha
 * concurrencia el contador puede subestimar y dejar pasar algo más del
 * límite configurado. Aceptable como respaldo (la alternativa es un
 * script Lua atómico); los fallos de red abren el paso (fail-open) para
 * no bloquear tráfico legítimo.
 */
export class UpstashRateLimitStore implements RateLimitStore {
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async get(key: string): Promise<RateLimitEntry | undefined> {
    try {
      const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        // Fail-open, pero con aviso: un 401/429/5xx de Upstash (p. ej. token
        // mal configurado) desactivaría el rate limiting en silencio.
        console.error(
          `[rate-limit] Upstash respondió ${res.status} en GET de '${key}' — rate limiting desactivado para esta clave`
        );
        return undefined;
      }
      const data = (await res.json()) as { result?: string };
      if (!data.result) return undefined;
      return JSON.parse(data.result) as RateLimitEntry;
    } catch (err) {
      console.error('[rate-limit] Error leyendo de Upstash:', err);
      return undefined;
    }
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    try {
      const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
      const value = encodeURIComponent(JSON.stringify(entry));
      const res = await fetch(
        `${this.url}/set/${encodeURIComponent(key)}/${value}?EX=${ttlSeconds}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
          cache: 'no-store',
        }
      );
      if (!res.ok) {
        console.error(
          `[rate-limit] Upstash respondió ${res.status} en SET de '${key}' — el contador no se guardó`
        );
      }
    } catch (err) {
      console.error('[rate-limit] Error escribiendo en Upstash:', err);
    }
  }
}

// ─── Selección del almacén ───────────────────────────────────────────

function createStore(): RateLimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new UpstashRateLimitStore(url, token);
  }
  return new MemoryRateLimitStore();
}

const store: RateLimitStore = createStore();

/**
 * Restablece el almacén en memoria (para pruebas).
 * No afecta al almacén distribuido.
 */
export function resetRateLimitStore(): void {
  if (store instanceof MemoryRateLimitStore) {
    store.clear();
  }
}

// ─── Funciones públicas ──────────────────────────────────────────────

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'anonymous';
}

/** Clave por IP + ruta: limita cada endpoint de forma independiente. */
export function rateLimitKey(request: Request): string {
  return `${clientIp(request)}:${new URL(request.url).pathname}`;
}

/** Presupuesto global por IP (todas las rutas combinadas). */
const GLOBAL_RATE_LIMIT: RateLimitOptions = { maxRequests: 100, windowMs: 60_000 };

/**
 * Comprueba el límite por ruta y, si pasa, el presupuesto global por IP.
 * Devuelve el primer fallo (o el resultado de la ruta si ambos pasan).
 */
export async function checkRouteRateLimit(
  request: Request,
  routeOptions: RateLimitOptions,
  globalOptions: RateLimitOptions = GLOBAL_RATE_LIMIT
): Promise<RateLimitResult> {
  const routeResult = await checkRateLimit(rateLimitKey(request), routeOptions);
  if (!routeResult.allowed) return routeResult;
  return checkRateLimit(`global:${clientIp(request)}`, globalOptions);
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions = { maxRequests: 10, windowMs: 60_000 }
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = await store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs;
    await store.set(key, { count: 1, resetAt }, options.windowMs);
    return { allowed: true, remaining: options.maxRequests - 1, resetAt };
  }

  const count = entry.count + 1;
  await store.set(key, { count, resetAt: entry.resetAt }, options.windowMs);

  if (count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: options.maxRequests - count, resetAt: entry.resetAt };
}
