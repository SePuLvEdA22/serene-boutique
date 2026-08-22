import { NextResponse } from 'next/server';
import { getProductRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { ProductSchema } from '@/lib/models';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({ products: await getProductRepo().findAll() });
}

export async function POST(request: Request) {
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

    const body = await request.json();

    if (!body.name || !body.price || !body.category) {
      return NextResponse.json({ error: 'Nombre, precio y categoría son requeridos' }, { status: 400 });
    }

    const id = body.id || body.name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
      .replace(/[á]/g, 'a')
      .replace(/[é]/g, 'e')
      .replace(/[í]/g, 'i')
      .replace(/[ó]/g, 'o')
      .replace(/[ú]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');

    if (await getProductRepo().findById(id)) {
      return NextResponse.json({ error: 'Ya existe un producto con ese ID' }, { status: 409 });
    }

    const images = Array.isArray(body.images) ? body.images.filter((u: unknown) => typeof u === 'string') : [];

    const parsed = ProductSchema.safeParse({
      id,
      name: body.name,
      description: body.description || '',
      price: Number(body.price),
      salePrice:
        body.salePrice !== undefined && body.salePrice !== null && body.salePrice !== ''
          ? Number(body.salePrice)
          : undefined,
      images: images.length > 0 ? images : undefined,
      image: typeof body.image === 'string' && body.image ? body.image : images[0],
      category: body.category,
      featured: Boolean(body.featured),
      active: body.active !== undefined ? Boolean(body.active) : true,
      colors: body.colors || [],
      tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === 'string') : [],
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      createdAt: new Date().toISOString().split('T')[0],
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de producto inválidos' }, { status: 400 });
    }

    await getProductRepo().create(parsed.data);

    return NextResponse.json({ product: parsed.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}