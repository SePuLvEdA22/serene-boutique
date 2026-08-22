import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getUserRepo } from '@/lib/repositories';
import { getSessionUser, AUTH_COOKIE, AUTH_REFRESH_COOKIE } from '@/lib/session';
import { deleteUserAccount } from '@/lib/account-deletion';
import { ADMIN_REFRESH_COOKIE } from '@/lib/admin';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

const deleteAccountSchema = z.object({
  password: z.string().trim().min(1, 'Confirma tu contraseña'),
});

/**
 * POST /api/auth/delete-account — elimina la cuenta del usuario autenticado
 * (derecho de cancelación, Ley 1581).
 *
 * Exige confirmación con la contraseña actual y no aplica a cuentas admin
 * (el admin se gestiona con variables de entorno).
 */
export async function POST(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      );
    }

    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const user = await getUserRepo().findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'La cuenta de administrador no se puede eliminar desde aquí' },
        { status: 400 }
      );
    }

    if (!bcrypt.compareSync(parsed.data.password, user.password)) {
      return NextResponse.json({ error: 'La contraseña no es correcta' }, { status: 400 });
    }

    await deleteUserAccount(user.id);

    const response = NextResponse.json({ message: 'Cuenta eliminada' }, { status: 200 });
    for (const name of [AUTH_COOKIE, AUTH_REFRESH_COOKIE, 'admin-token', ADMIN_REFRESH_COOKIE]) {
      response.cookies.set(name, '', { maxAge: 0, path: '/' });
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 });
  }
}
