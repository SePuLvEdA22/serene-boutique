import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const product = db.products.get().find(p => p.id === id);

  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const products = db.products.get();
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    const updated = {
      ...products[index],
      name: body.name ?? products[index].name,
      description: body.description ?? products[index].description,
      price: body.price !== undefined ? Number(body.price) : products[index].price,
      category: body.category ?? products[index].category,
      featured: body.featured !== undefined ? Boolean(body.featured) : products[index].featured,
      colors: body.colors !== undefined ? body.colors : products[index].colors,
      image: body.image !== undefined ? body.image : products[index].image,
      stock: body.stock !== undefined ? Number(body.stock) : products[index].stock,
    };

    const list = [...products];
    list[index] = updated;
    db.products.set(list);

    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const products = db.products.get();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  db.products.set(products.filter(p => p.id !== id));

  return NextResponse.json({ success: true });
}
