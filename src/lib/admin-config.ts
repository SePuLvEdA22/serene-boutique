/**
 * Credenciales de administrador — leídas SIEMPRE de variables de entorno.
 *
 * En producción, si faltan (o no cumplen la política de contraseñas), el
 * proceso falla explícitamente (fail-fast) en vez de crear silenciosamente
 * una cuenta admin con credenciales por defecto conocidas.
 *
 * Los fallbacks solo existen en desarrollo/test y son claramente de prueba.
 */
import { passwordSchema } from './validation';

export function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (email) return email;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_EMAIL no está configurado. Defínelo en las variables de entorno antes de desplegar.'
    );
  }

  return 'admin@switchandtech.mx';
}

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    // Aplicar la misma política que a los clientes: mín. 8, mayúscula y número.
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      throw new Error(
        'ADMIN_PASSWORD no cumple la política de contraseñas: mínimo 8 caracteres, al menos una mayúscula y un número.'
      );
    }
    return password;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_PASSWORD no está configurado. Defínelo en las variables de entorno antes de desplegar.'
    );
  }

  return 'Dev-Admin-ChangeMe-123!';
}
