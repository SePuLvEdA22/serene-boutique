import { NextResponse } from 'next/server';
import { getProductRepo } from '@/lib/repositories';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductRepo().findById(id);

  if (!product || product.active === false) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ product });
}