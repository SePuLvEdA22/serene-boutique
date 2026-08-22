import { NextResponse } from 'next/server';
import { getContactRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const contacts = (await getContactRepo().findAll()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ contacts });
}