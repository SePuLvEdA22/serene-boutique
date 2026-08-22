import { NextResponse } from 'next/server';
import { getProductRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { ProductSchema } from '@/lib/models';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const product = await getProductRepo().findById(id);

  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await getProductRepo().findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const images =
      Array.isArray(body.images) && body.images.length > 0
        ? body.images.filter((u: unknown) => typeof u === 'string')
        : existing.images;
    const image =
      typeof body.image === 'string' && body.image
        ? body.image
        : images.length > 0 && (images[0] !== existing.image || !existing.image)
        ? images[0]
        : existing.image;

    // Merge canónico + validación con ProductSchema (igual que el POST).
    const candidate = {
      id: existing.id,
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      price: body.price !== undefined ? Number(body.price) : existing.price,
      salePrice:
        body.salePrice === null || body.salePrice === ''
          ? undefined // Limpiar la oferta
          : body.salePrice !== undefined
          ? Number(body.salePrice)
          : existing.salePrice,
      images,
      image,
      category: body.category ?? existing.category,
      featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
      active: body.active !== undefined ? Boolean(body.active) : existing.active ?? true,
      colors: body.colors ?? existing.colors,
      tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === 'string') : existing.tags,
      stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
      createdAt: existing.createdAt,
    };

    const parsed = ProductSchema.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de producto inválidos' },
        { status: 400 }
      );
    }

    const updated = await getProductRepo().update(id, parsed.data);

    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  const rl = await checkRouteRateLimit(request, {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
      { status: 429 }
    );
  }

  const { id } = await params;
  const deleted = await getProductRepo().delete(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}