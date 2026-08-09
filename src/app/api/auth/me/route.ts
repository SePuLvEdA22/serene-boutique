import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyUserToken } from '@/lib/auth';
import { getUserRepo } from '@/lib/repositories';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = await verifyUserToken(token.value);

    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const stored = getUserRepo().findById(payload.id);

    return NextResponse.json({
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        isAdmin: stored?.isAdmin === true,
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
