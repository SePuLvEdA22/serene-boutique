import { NextResponse } from 'next/server';
import { getUserRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const users = getUserRepo()
    .findAll()
    .filter(u => !u.isAdmin)
    .map(({ password: _, ...rest }) => rest);

  return NextResponse.json({ users });
}