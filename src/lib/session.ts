/**
 * Sesiones de usuario con refresh tokens rotativos (patrón "access corto +
 * refresh largo con rotación" en lugar de JWT de larga duración).
 *
 * - El access token (JWT, 15 min) viaja en la cookie `auth-token`.
 * - El refresh token es opaco (256 bits), se almacena SOLO hasheado en la BD
 *   y se rota en cada uso: el token usado queda invalidado y se emite uno nuevo.
 * - `kind` ('user' | 'admin') evita que un refresh de cliente pueda renovar
 *   una sesión de administración.
 * - `getSessionUser()` auto-curó la sesión en cada carga de página cuando el
 *   access expiró (sliding session).
 *
 * También incluye el bloqueo temporal de cuenta tras N intentos fallidos.
 */
import { cookies } from 'next/headers';
import { getUserRepo } from '@/lib/repositories';
import {
  signUserToken,
  verifyUserToken,
  generateRefreshToken,
  hashRefreshToken,
  ACCESS_TOKEN_TTL_SECONDS,
} from '@/lib/auth';
import type { RefreshToken, RefreshTokenKind, User } from '@/lib/models';

export const AUTH_COOKIE = 'auth-token';
export const AUTH_REFRESH_COOKIE = 'auth-refresh';

/** Vigencia de un refresh token: 30 días para clientes. */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Máximo de refresh tokens activos por tipo y usuario (control de rotación). */
const MAX_REFRESH_TOKENS_PER_KIND = 5;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function secureCookie(): boolean {
  return process.env.NODE_ENV === 'production';
}

function activeRefreshEntries(user: User): RefreshToken[] {
  return (user.refreshTokens ?? []).filter(
    (t) => new Date(t.expiresAt).getTime() > Date.now()
  );
}

function refreshEntry(token: string, kind: RefreshTokenKind) {
  return {
    hash: hashRefreshToken(token),
    kind,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/** Emite un refresh token para un usuario y lo persiste (solo el hash). */
export async function issueRefreshToken(userId: string, kind: RefreshTokenKind): Promise<string> {
  const token = generateRefreshToken();
  const user = await getUserRepo().findById(userId);
  if (user) {
    const activeOfKind = activeRefreshEntries(user).filter((t) => t.kind === kind);
    await getUserRepo().update(userId, {
      refreshTokens: [
        ...activeOfKind.slice(-(MAX_REFRESH_TOKENS_PER_KIND - 1)),
        refreshEntry(token, kind),
      ],
    });
  }
  return token;
}

/**
 * Consume un refresh token (rotación): invalida el usado y emite uno nuevo.
 * Devuelve `null` si el token no existe, expiró o no corresponde al `kind`.
 */
export async function consumeRefreshToken(
  token: string,
  kind: RefreshTokenKind
): Promise<{ user: User; newToken: string } | null> {
  const hash = hashRefreshToken(token);

  const all = await getUserRepo().findAll();
  const user = all.find((u) =>
    (u.refreshTokens ?? []).some(
      (t) => t.kind === kind && t.hash === hash && new Date(t.expiresAt).getTime() > Date.now()
    )
  );

  if (!user) return null;

  const remaining = activeRefreshEntries(user).filter(
    (t) => !(t.kind === kind && t.hash === hash)
  );
  const newToken = generateRefreshToken();
  await getUserRepo().update(user.id, {
    refreshTokens: [
      ...remaining.slice(-(MAX_REFRESH_TOKENS_PER_KIND - 1)),
      refreshEntry(newToken, kind),
    ],
  });

  return { user, newToken };
}

/** Revoca un refresh token concreto (logout) buscándolo por su hash. */
export async function revokeRefreshToken(token: string): Promise<void> {
  if (!token) return;
  const hash = hashRefreshToken(token);
  const all = await getUserRepo().findAll();
  const user = all.find((u) =>
    (u.refreshTokens ?? []).some((t) => t.hash === hash)
  );
  if (!user) return;
  await getUserRepo().update(user.id, {
    refreshTokens: (user.refreshTokens ?? []).filter((t) => t.hash !== hash),
  });
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin === true,
  };
}

function setSessionCookies(store: CookieStore, accessToken: string, refreshToken: string): void {
  store.set(AUTH_COOKIE, accessToken, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: '/',
  });
  store.set(AUTH_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'strict',
    maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
    path: '/',
  });
}

export function clearSessionCookies(store: CookieStore): void {
  store.set(AUTH_COOKIE, '', { maxAge: 0, path: '/' });
  store.set(AUTH_REFRESH_COOKIE, '', { maxAge: 0, path: '/' });
}

/**
 * Usuario autenticado actual (o `null`).
 * Si el access token expiró, rota el refresh token y reemite ambas cookies
 * (auto-curación); si el refresh no es válido, limpia las cookies.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();

  const access = store.get(AUTH_COOKIE)?.value;
  if (access) {
    const payload = await verifyUserToken(access);
    if (payload) {
      const stored = await getUserRepo().findById(payload.id);
      return stored ? toSessionUser(stored) : null;
    }
  }

  const refresh = store.get(AUTH_REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const consumed = await consumeRefreshToken(refresh, 'user');
  if (!consumed) {
    // No limpiar cookies aquí: si dos peticiones consumieron el mismo refresh
    // en paralelo (carrera de rotación), la primera ya emitió una cookie nueva
    // y borrarla aquí destruiría la sesión ya renovada. Un token inválido
    // simplemente deja la sesión como no autenticada.
    return null;
  }

  const accessToken = await signUserToken({
    id: consumed.user.id,
    email: consumed.user.email,
    name: consumed.user.name,
  });
  setSessionCookies(store, accessToken, consumed.newToken);

  return toSessionUser(consumed.user);
}

// ─── Bloqueo temporal de cuenta (fuerza bruta) ─────────────────────────

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/** Milisegundos restantes de bloqueo (0 si no hay bloqueo activo). */
export function getLockoutRemainingMs(user: {
  failedLoginAttempts?: number;
  lockoutUntil?: string;
}): number {
  if (!user.lockoutUntil) return 0;
  const remaining = new Date(user.lockoutUntil).getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

/** Registra un intento fallido; al llegar a MAX_LOGIN_ATTEMPTS bloquea la cuenta. */
export async function applyFailedLoginAttempt(userId: string): Promise<void> {
  const user = await getUserRepo().findById(userId);
  if (!user) return;
  const attempts = (user.failedLoginAttempts ?? 0) + 1;
  const locked = attempts >= MAX_LOGIN_ATTEMPTS;
  await getUserRepo().update(userId, {
    failedLoginAttempts: attempts,
    ...(locked
      ? { lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() }
      : {}),
  });
}

/** Reinicia el contador de intentos tras un login exitoso. */
export async function resetLoginAttempts(userId: string): Promise<void> {
  await getUserRepo().update(userId, { failedLoginAttempts: 0, lockoutUntil: undefined });
}
