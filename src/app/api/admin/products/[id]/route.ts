import { NextResponse } from 'next/server';
import { getProductRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const product = getProductRepo().findById(id);

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

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = getProductRepo().findById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const updated = getProductRepo().update(id, {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      price: body.price !== undefined ? Number(body.price) : existing.price,
      category: body.category ?? existing.category,
      featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
      colors: body.colors ?? existing.colors,
      stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
    });

    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const deleted = getProductRepo().delete(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}