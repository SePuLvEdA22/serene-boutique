import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserRepo } from '@/lib/repositories';
import { getSessionUser } from '@/lib/session';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validation';
import { checkRouteRateLimit } from '@/lib/rate-limit';
import { csrfBlocked } from '@/lib/csrf';

export async function PUT(request: Request) {
  const blocked = csrfBlocked(request);
  if (blocked) return blocked;

  try {
    const rl = await checkRouteRateLimit(request, {
      maxRequests: 10,
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
    const { action } = body;

    if (action === 'name') {
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        return NextResponse.json(
          { error: firstError?.message || 'Datos inválidos' },
          { status: 400 }
        );
      }

      const user = await getUserRepo().findById(session.id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      await getUserRepo().update(session.id, { name: parsed.data.name });

      return NextResponse.json({
        user: { id: user.id, name: parsed.data.name, email: user.email },
      });
    }

    if (action === 'password') {
      const parsed = changePasswordSchema.safeParse(body);
      if (!parsed.success) {
        const firstError = parsed.error.issues[0];
        return NextResponse.json(
          { error: firstError?.message || 'Datos inválidos' },
          { status: 400 }
        );
      }

      const user = await getUserRepo().findById(session.id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      if (!bcrypt.compareSync(parsed.data.currentPassword, user.password)) {
        return NextResponse.json(
          { error: 'La contraseña actual no es correcta' },
          { status: 400 }
        );
      }

      const hashedPassword = bcrypt.hashSync(parsed.data.newPassword, 10);
      await getUserRepo().update(session.id, { password: hashedPassword });

      return NextResponse.json({ message: 'Contraseña actualizada correctamente' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err) {
    console.error('[Profile] Error:', err);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
