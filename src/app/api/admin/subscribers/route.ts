import { NextResponse } from 'next/server';
import { getSubscriberRepo } from '@/lib/repositories';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const subscribers = (await getSubscriberRepo().findAll()).sort(
    (a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
  );

  return NextResponse.json({ subscribers });
}