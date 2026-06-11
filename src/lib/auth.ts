import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production-min-32-chars!!'
);

const ISSUER = 'switch-and-tech';
const AUDIENCE = 'switch-and-tech-users';

export interface UserToken extends JWTPayload {
  id: string;
  email: string;
  name: string;
}

export interface AdminToken extends JWTPayload {
  userId: string;
}

export async function signUserToken(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  return await new SignJWT({ id: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function signAdminToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience('switch-and-tech-admin')
    .setExpirationTime('24h')
    .sign(SECRET);
}

export async function verifyUserToken(
  token: string
): Promise<UserToken | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.id || !payload.email) return null;
    return payload as unknown as UserToken;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(
  token: string
): Promise<AdminToken | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      issuer: ISSUER,
      audience: 'switch-and-tech-admin',
    });
    if (!payload.userId) return null;
    return payload as unknown as AdminToken;
  } catch {
    return null;
  }
}
