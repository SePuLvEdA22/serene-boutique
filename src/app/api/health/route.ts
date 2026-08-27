import { NextResponse } from 'next/server';
import { checkRouteRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * GET /api/health — sonda redacted para diagnóstico de persistencia.
 *
 * No expone: DATABASE_URL, JWT_SECRET, ADMIN_*, emails, hashes, ni filas.
 * Solo: driver normalizado, boolean hasDatabaseUrl, boolean canConnect, counts agregados.
 */
function normalizedDriver(): string {
  const v = (process.env.STORE_DRIVER || '').trim().toLowerCase();
  if (v === 'postgres' || v === 'memory' || v === 'lowdb') return v;
  if (!process.env.STORE_DRIVER) return 'lowdb';
  return v || 'lowdb';
}

export async function GET(request: Request) {
  const rl = await checkRouteRateLimit(request, { maxRequests: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  const driver = normalizedDriver();
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  let canConnect = false;
  let counts: { users: number; orders: number } | undefined;

  if (driver === 'postgres' && hasDatabaseUrl) {
    try {
      const { createNeonClient } = await import('@/lib/store/postgres-store');
      const client = createNeonClient();
      // Probe mínimo: SELECT 1 (sin datos sensibles) — si falla, canConnect=false
      await client.query('SELECT 1 as ok', []);
      canConnect = true;
      // Counts agregados solamente (nunca filas/emails)
      try {
        const [u, o] = await Promise.all([
          client.query('SELECT count(*)::text as c FROM users', []),
          client.query('SELECT count(*)::text as c FROM orders', []),
        ]);
        const users = Number((u[0] as Record<string, unknown>)?.c ?? 0);
        const orders = Number((o[0] as Record<string, unknown>)?.c ?? 0);
        counts = {
          users: Number.isFinite(users) ? users : 0,
          orders: Number.isFinite(orders) ? orders : 0,
        };
      } catch {
        // Si counts falla pero SELECT 1 pasó, mantener canConnect=true sin counts
        console.error('[health] probe counts failed');
      }
    } catch {
      // No loguear e.message (podría contener host/URL redacted por el driver)
      console.error('[health] db probe failed');
      canConnect = false;
    }
  } else if (driver === 'postgres' && !hasDatabaseUrl) {
    canConnect = false;
  } else {
    // lowdb/memory: no hay conexión externa que probar
    canConnect = false;
  }

  const body: Record<string, unknown> = {
    ok: driver === 'postgres' && hasDatabaseUrl && canConnect,
    driver,
    hasDatabaseUrl,
    canConnect,
  };
  if (counts) body.counts = counts;

  return NextResponse.json(body, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
