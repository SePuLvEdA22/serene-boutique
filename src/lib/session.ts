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
export const ADMIN_COOKIE = 'admin-token';
export const ADMIN_REFRESH_COOKIE = 'admin-refresh';

/** Vigencia de un refresh token: 30 días para clientes. */
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Máximo de refresh tokens activos por tipo y usuario (control de rotación). */
const MAX_REFRESH_TOKENS_PER_KIND = 5;
/**
 * Ventana de gracia ante reuso: dos consumos casi simultáneos del mismo token
 * (carrera de rotación paralela, p. ej. varias pestañas) NO se consideran robo.
 * Pasada la ventana, presentar un token ya usado ES señal de robo.
 */
export const REFRESH_REUSE_GRACE_MS = 60 * 1000;
/**
 * Retención de los hashes ya usados: mientras existan, presentarlos de nuevo
 * dispara la revocación total. Acotada para que el array no crezca sin límite.
 */
const REFRESH_USED_RETENTION_MS = 24 * 60 * 60 * 1000;

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

/**
 * Entradas de refresh "vivas": no expiradas y, si están marcadas como usadas,
 * aún dentro de la ventana de retención (sirven para detectar reuso).
 */
function liveRefreshEntries(user: User): RefreshToken[] {
  const now = Date.now();
  return (user.refreshTokens ?? []).filter((t) => {
    if (new Date(t.expiresAt).getTime() <= now) return false;
    if (t.usedAt && now - new Date(t.usedAt).getTime() > REFRESH_USED_RETENTION_MS) {
      return false;
    }
    return true;
  });
}

/** Slots activos (sin marcar como usados) de un kind dado. */
function activeSlots(entries: RefreshToken[], kind: RefreshTokenKind): RefreshToken[] {
  return entries.filter((t) => t.kind === kind && !t.usedAt);
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
    const live = liveRefreshEntries(user);
    // Las marcas de reuso retenidas se conservan (no cuentan como slots activos).
    await getUserRepo().update(userId, {
      refreshTokens: [
        ...live.filter((t) => t.usedAt),
        ...activeSlots(live, kind).slice(-(MAX_REFRESH_TOKENS_PER_KIND - 1)),
        refreshEntry(token, kind),
      ],
    });
  }
  return token;
}

/**
 * Consume un refresh token (rotación): invalida el usado y emite uno nuevo.
 * Devuelve `null` si el token no existe, expiró o no corresponde al `kind`.
 *
 * Detección de reuso (robo de sesión):
 * - El token consumido queda retenido con la marca `usedAt`.
 * - Si vuelve a presentarse fuera de la ventana de gracia, se asume robo y se
 *   revocan TODOS los refresh tokens del usuario (todas sus sesiones mueren).
 * - Dentro de la ventana es una carrera de rotación legítima (varias pestañas):
 *   solo se rechaza el segundo consumo, sin revocar nada.
 */
export async function consumeRefreshToken(
  token: string,
  kind: RefreshTokenKind
): Promise<{ user: User; newToken: string } | null> {
  const hash = hashRefreshToken(token);

  const all = await getUserRepo().findAll();
  const user = all.find((u) =>
    (u.refreshTokens ?? []).some((t) => t.kind === kind && t.hash === hash)
  );

  if (!user) return null;

  const entry = (user.refreshTokens ?? []).find(
    (t) => t.kind === kind && t.hash === hash
  )!;

  // Reuso de un token ya rotado
  if (entry.usedAt) {
    const usedAgeMs = Date.now() - new Date(entry.usedAt).getTime();
    if (usedAgeMs > REFRESH_REUSE_GRACE_MS) {
      // Señal de robo: alguien presentó un token que ya fue canjeado por otra
      // sesión. Se quema toda la familia de refresh tokens del usuario.
      await getUserRepo().update(user.id, { refreshTokens: [] });
      console.warn(
        `[Sesión] Reuso de refresh token detectado (kind=${kind}) — ` +
          'revocadas todas las sesiones del usuario'
      );
    }
    // Dentro de la gracia: carrera de rotación paralela legítima.
    return null;
  }

  // Expirado sin uso: purgar la entrada y salir sin renovar.
  if (new Date(entry.expiresAt).getTime() <= Date.now()) {
    await getUserRepo().update(user.id, {
      refreshTokens: liveRefreshEntries(user).filter((t) => t.hash !== hash),
    });
    return null;
  }

  const nowIsoString = new Date().toISOString();
  const live = liveRefreshEntries(user);
  const newToken = generateRefreshToken();
  await getUserRepo().update(user.id, {
    refreshTokens: [
      // Marcas de reuso retenidas (excepto la que acabamos de crear aparte)
      ...live.filter((t) => t.usedAt && t.hash !== hash),
      // Slots activos del kind (cap de sesiones simultáneas)
      ...activeSlots(live, kind)
        .filter((t) => t.hash !== hash)
        .slice(-(MAX_REFRESH_TOKENS_PER_KIND - 1)),
      // El canjeado queda marcado para detectar su reuso
      { ...entry, usedAt: nowIsoString },
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

/**
 * Destino donde se escriben cookies de sesión: el `cookies()` de next/headers
 * (server components / route handlers) o `response.cookies` (NextResponse).
 * Ambos exponen `.set(name, value, options)`.
 */
export interface SessionCookieWriter {
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict';
      maxAge: number;
      path: string;
    }
  ): unknown;
}

const COOKIE_NAMES = {
  user: { access: AUTH_COOKIE, refresh: AUTH_REFRESH_COOKIE },
  admin: { access: ADMIN_COOKIE, refresh: ADMIN_REFRESH_COOKIE },
} as const;

function baseSessionOptions() {
  return {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'strict' as const,
    path: '/',
  };
}

/** Única fuente de verdad de las opciones de cookie de sesión. */
export function setSessionCookiePair(
  target: SessionCookieWriter,
  kind: RefreshTokenKind,
  accessToken: string,
  refreshToken: string
): void {
  const names = COOKIE_NAMES[kind];
  target.set(names.access, accessToken, {
    ...baseSessionOptions(),
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  target.set(names.refresh, refreshToken, {
    ...baseSessionOptions(),
    maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
  });
}

/** Invalida las cookies de sesión de ambos kinds en la respuesta. */
export function clearAllSessionCookies(target: { set(name: string, value: string, options: { maxAge: number; path: string }): unknown }): void {
  for (const name of [AUTH_COOKIE, AUTH_REFRESH_COOKIE, ADMIN_COOKIE, ADMIN_REFRESH_COOKIE]) {
    target.set(name, '', { maxAge: 0, path: '/' });
  }
}

function setSessionCookies(store: CookieStore, accessToken: string, refreshToken: string): void {
  setSessionCookiePair(store, 'user', accessToken, refreshToken);
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
