import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

/**
 * GET /api/auth/me — devuelve el usuario autenticado.
 *
 * Si el access token expiró, renueva la sesión silenciosamente (rotación del
 * refresh token) y reemite las cookies, de modo que la sesión sobrevive a los
 * 15 min del access token sin que el cliente tenga que hacer nada.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
