import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = JSON.parse(Buffer.from(token.value, 'base64').toString('utf-8'));

    return NextResponse.json({
      user: { id: payload.id, name: payload.name, email: payload.email },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
