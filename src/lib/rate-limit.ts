/**
 * Rate limiting con almacenes intercambiables.
 *
 * - Por defecto usa un `Map` en memoria (útil en desarrollo y tests).
 * - Si se configuran `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`,
 *   usa Upstash Redis (REST) para compartir el estado entre instancias
 *   serverless (requisito para que el límite funcione en Vercel).
 * - El incremento es atómico en ambos almacenes (pipeline INCR/EXPIRE en
 *   Upstash; evento del event-loop en memoria), así que la concurrencia no
 *   subestima el contador.
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

interface IncrementResult {
  count: number;
  resetAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  /**
   * Incrementa el contador de forma atómica y devuelve el estado resultante.
   * La ventana es fija: arranca en la primera petición y no se extiende.
   */
  increment(key: string, windowMs: number): Promise<IncrementResult>;
}

// ─── Almacén en memoria ──────────────────────────────────────────────

class MemoryRateLimitStore implements RateLimitStore {
  private readonly store = new Map<string, RateLimitEntry>();
  private static readonly MAX_ENTRIES = 10_000;

  async increment(key: string, windowMs: number): Promise<IncrementResult> {
    const now = Date.now();

    // Poda oportunista: evita crecimiento ilimitado con claves únicas (ip:ruta).
    if (this.store.size >= MemoryRateLimitStore.MAX_ENTRIES) {
      for (const [k, e] of this.store) {
        if (now > e.resetAt) this.store.delete(k);
      }
    }

    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { count: 1, resetAt };
    }

    entry.count += 1;
    return { count: entry.count, resetAt: entry.resetAt };
  }

  clear(): void {
    this.store.clear();
  }
}

// ─── Almacén distribuido (Upstash Redis REST) ────────────────────────

interface PipelineReply {
  result?: unknown;
  error?: string;
}

/**
 * Almacén distribuido sobre la API REST de Upstash Redis.
 *
 * Usa un único POST a `/pipeline` con [INCR, EXPIRE NX, PTTL]: el contador se
 * incrementa atómicamente y el TTL solo se fija en la primera petición de la
 * ventana (ventana fija). Si Upstash falla o responde mal, abre el paso
 * (fail-open) para no bloquear tráfico legítimo, dejando log del incidente.
 */
export class UpstashRateLimitStore implements RateLimitStore {
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async increment(key: string, windowMs: number): Promise<IncrementResult> {
    const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    const commands = [
      ['INCR', key],
      ['EXPIRE', key, String(ttlSeconds), 'NX'],
      ['PTTL', key],
    ];

    try {
      const res = await fetch(`${this.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
        cache: 'no-store',
      });

      if (!res.ok) {
        // Un 401/429/5xx de Upstash (p. ej. token mal configurado) desactivaría
        // el rate limiting en silencio si no lo registramos.
        console.error(
          `[rate-limit] Upstash respondió ${res.status} en pipeline de '${key}' — fail-open`
        );
        return this.openResult(windowMs);
      }

      const replies = (await res.json()) as PipelineReply[];
      const incr = replies[0]?.result;
      const pttl = replies[2]?.result;

      if (typeof incr !== 'number') {
        console.error(`[rate-limit] Respuesta INCR inválida para '${key}' — fail-open`);
        return this.openResult(windowMs);
      }
      if (replies.some((r) => r.error)) {
        console.error(`[rate-limit] Error parcial de Upstash para '${key}':`, replies.map((r) => r.error));
      }

      // PTTL > 0: ventana ya anclada. PTTL -1: la clave quedó sin TTL (carrera
      // con expiración); reparamos best-effort con un EXPIRE adicional.
      let resetAt: number;
      if (typeof pttl === 'number' && pttl > 0) {
        resetAt = Date.now() + pttl;
      } else {
        resetAt = Date.now() + windowMs;
        void this.rearmExpiry(key, ttlSeconds);
      }

      return { count: incr, resetAt };
    } catch (err) {
      console.error('[rate-limit] Error contactando Upstash — fail-open:', err);
      return this.openResult(windowMs);
    }
  }

  private openResult(windowMs: number): IncrementResult {
    return { count: 0, resetAt: Date.now() + windowMs };
  }

  /** Best-effort: re-ancla el TTL de una clave que quedó sin expiración. */
  private async rearmExpiry(key: string, ttlSeconds: number): Promise<void> {
    try {
      await fetch(`${this.url}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
        cache: 'no-store',
      });
    } catch {
      // Sin acción: el siguiente incremento volvería a intentarlo vía PTTL -1.
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

/**
 * Resuelve la IP del cliente priorizando cabeceras fijadas por la plataforma:
 * - `x-real-ip` la establece el proxy de confianza (Vercel/nginx) y el cliente
 *   no puede spoofearla.
 * - En `x-forwarded-for`, los primeros saltos SÍ pueden ser spoofeados por el
 *   cliente; detrás de un único proxy confiable, el último salto es el que él
 *   añadió y por tanto el verificable.
 */
function clientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  return 'anonymous';
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
  const { count, resetAt } = await store.increment(key, options.windowMs);

  if (count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: options.maxRequests - count, resetAt };
}
