import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const users = db.users.get()
    .filter(u => !u.isAdmin)
    .map(({ password, ...rest }) => rest);

  return NextResponse.json({ users });
}
