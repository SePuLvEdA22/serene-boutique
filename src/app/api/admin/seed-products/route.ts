import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getProductRepo } from '@/lib/repositories';
import { initialProducts } from '@/lib/product-data';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export const runtime = 'nodejs';

/**
 * POST /api/admin/seed-products — siembra productos iniciales en Neon.
 *
 * Protegido por requireAdmin (cookie admin-token + refresh). Solo admin puede
 * sembrar. No expone PII ni secretos: responde solo counts.
 *
 * Query ?force=1 para re-sembrar incluso si ya hay productos (upsert).
 */
export async function POST(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  const rl = await checkRouteRateLimit(request, { maxRequests: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';

  const before = await getProductRepo().findAll();
  const beforeCount = before.length;

  if (beforeCount > 0 && !force) {
    return NextResponse.json(
      { ok: true, seeded: false, before: beforeCount, after: beforeCount, message: 'Ya hay productos, usa ?force=1 para re-sembrar' },
      { status: 200 }
    );
  }

  // Si force, merge por id (upsert vía setProducts que es UPSERT + DELETE)
  // Si vacío, inserta directamente los 14 iniciales.
  // Respetar force: reemplazar todo por initialProducts.
  // Sin force y vacío: insertar initialProducts.
  const toSeed = initialProducts;

  // Usar repositorio que delega a PostgresStore.setProducts (UPSERT transaccional)
  // Para evitar borrar productos custom si force=false y hay 0, simplemente set.
  // Si force y había productos, reemplazará por initialProducts (comportamiento deseado para seed).
  const { getStore } = await import('@/lib/store');
  const store = getStore();
  await store.setProducts(toSeed as never);

  const after = await getProductRepo().findAll();

  console.log(`[seed-products] seeded ${after.length} products (before ${beforeCount}) by admin ${admin.id}`);

  return NextResponse.json(
    { ok: true, seeded: true, before: beforeCount, after: after.length },
    { status: 200 }
  );
}

export async function GET() {
  // GET para diagnóstico rápido (solo admin)
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const products = await getProductRepo().findAll();
  return NextResponse.json({ count: products.length }, { status: 200 });
}
