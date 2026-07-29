import { NextResponse } from 'next/server';
import { getProductRepo } from '@/lib/repositories';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

  let result = getProductRepo().findAll();

  if (category && (category === 'fundas' || category === 'cargadores' || category === 'termos' || category === 'personalizados')) {
    result = getProductRepo().findByCategory(category);
  }

  if (search) {
    result = getProductRepo().search(search);
  }

  const total = result.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  return NextResponse.json({
    products: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}