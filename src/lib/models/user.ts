import { z } from 'zod';

/**
 * Sesión de refresh token almacenada en el servidor (solo el hash).
 * `kind` separa tokens de cliente de tokens de admin para que un token de
 * cliente jamás pueda usarse para renovar una sesión de administración.
 *
 * `usedAt`: marca de rotación. Un token consumido NO se borra de inmediato:
 * queda retenido un tiempo con esta marca para detectar REUSO (señal clásica
 * de robo de sesión) y revocar todas las sesiones del usuario.
 */
export const RefreshTokenSchema = z.object({
  hash: z.string().min(1),
  kind: z.enum(['user', 'admin']),
  expiresAt: z.string(),
  createdAt: z.string(),
  usedAt: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  isAdmin: z.boolean().optional().default(false),
  createdAt: z.string().optional(),
  /** Momento en que el usuario aceptó la política de privacidad (Ley 1581). */
  consentAt: z.string().optional(),
  /** Intentos de login fallidos consecutivos (para bloqueo temporal de cuenta). */
  failedLoginAttempts: z.number().int().nonnegative().optional(),
  /** Hasta cuándo está bloqueada la cuenta tras N intentos fallidos. */
  lockoutUntil: z.string().optional(),
  /** Refresh tokens activos (hasheados) emitidos para este usuario. */
  refreshTokens: z.array(RefreshTokenSchema).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenKind = RefreshToken['kind'];
