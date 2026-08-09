import { NextResponse } from 'next/server';
import { csrfBlocked } from '@/lib/csrf';

export async function POST(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  const response = NextResponse.json({ message: 'Sesión cerrada' });
  response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
  // Si la cuenta es admin, también cerrar la sesión de administración
  // (el login de clientes emite ambas cookies para cuentas admin).
  response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
  return response;
}
