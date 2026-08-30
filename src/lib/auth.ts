import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify, errors as joseErrors, type JWTPayload } from "jose";

/**
 * Secreto de firma de JWT.
 *
 * En producción se exige `JWT_SECRET` configurado (mín. 32 caracteres): sin él,
 * la app falla al arrancar en vez de firmar tokens con un secreto conocido y
 * publicado en el código. El fallback solo existe para desarrollo/test.
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    if (secret.length < 32 && process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET debe tener al menos 32 caracteres en producción.");
    }
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET no está configurado. Defínelo en las variables de entorno antes de desplegar."
    );
  }

  return "dev-secret-do-not-use-in-production-min-32-chars!!";
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

// Fail-fast en producción: validar al importar (exigido por tests de secret).
// Mantiene la ventaja lazy para rotación de env en dev, pero en prod el proceso
// falla al arrancar si la clave falta o es corta.
if (process.env.NODE_ENV === "production") {
  getJwtSecret();
}

const ISSUER = "switch-and-tech";
const AUDIENCE = "switch-and-tech-users";

/**
 * Los access tokens son de corta duración (15 min); la sesión se mantiene con
 * refresh tokens opacos rotativos almacenados en el servidor (ver session.ts).
 */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export interface UserToken extends JWTPayload {
  id: string;
  email: string;
  name: string;
}

export interface AdminToken extends JWTPayload {
  userId: string;
}

/** Genera un refresh token opaco (256 bits aleatorios). */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash del refresh token (SHA-256): solo se almacena el hash en la BD. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** jose: un número en setExpirationTime es un timestamp Unix, no una duración. */
function accessTokenExpiration(): number {
  return Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS;
}

export async function signUserToken(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  return await new SignJWT({ id: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(accessTokenExpiration())
    .sign(getSecret());
}

export async function signAdminToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience("switch-and-tech-admin")
    .setExpirationTime(accessTokenExpiration())
    .sign(getSecret());
}

export async function verifyUserToken(token: string): Promise<UserToken | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.id || !payload.email) return null;
    return payload as unknown as UserToken;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(token: string): Promise<AdminToken | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: "switch-and-tech-admin",
    });
    if (!payload.userId) return null;
    return payload as unknown as AdminToken;
  } catch {
    return null;
  }
}

/**
 * Estado de un access token sin tratar expiración como invalidez:
 * - 'valid'   → firma y vigencia correctas.
 * - 'expired' → firma correcta pero vencido (la sesión puede renovarse con
 *               el refresh token; NO debe tratarse como cookie falsificada).
 * - 'invalid' → firma inválida, formato incorrecto o claims ausentes.
 *
 * Lo consume el proxy para decidir bloqueos sin tocar la base de datos:
 * una cookie basura se bloquea en la puerta, un token vencido deja pasar
 * la petición para que `requireAdmin()`/`getSessionUser()` lo renueven.
 */
export type TokenState = "valid" | "expired" | "invalid";

async function inspectToken(
  token: string,
  audience: string,
  hasRequiredClaims: (payload: JWTPayload) => boolean
): Promise<TokenState> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience,
    });
    return hasRequiredClaims(payload) ? "valid" : "invalid";
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) return "expired";
    return "invalid";
  }
}

export function inspectUserTokenState(token: string): Promise<TokenState> {
  return inspectToken(token, AUDIENCE, (p) => Boolean(p.id && p.email));
}

export function inspectAdminTokenState(token: string): Promise<TokenState> {
  return inspectToken(token, "switch-and-tech-admin", (p) => Boolean(p.userId));
}
