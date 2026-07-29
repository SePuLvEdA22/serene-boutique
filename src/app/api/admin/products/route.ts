import { NextResponse } from 'next/server';
import { getProductRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';
import { ProductSchema } from '@/lib/models';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  return NextResponse.json({ products: getProductRepo().findAll() });
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
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

    if (getProductRepo().findById(id)) {
      return NextResponse.json({ error: 'Ya existe un producto con ese ID' }, { status: 409 });
    }

    const parsed = ProductSchema.safeParse({
      id,
      name: body.name,
      description: body.description || '',
      price: Number(body.price),
      category: body.category,
      featured: Boolean(body.featured),
      colors: body.colors || [],
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      createdAt: new Date().toISOString().split('T')[0],
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos de producto inválidos' }, { status: 400 });
    }

    getProductRepo().create(parsed.data);

    return NextResponse.json({ product: parsed.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}