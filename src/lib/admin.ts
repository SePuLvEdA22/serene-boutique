import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { getUserRepo } from './repositories';
import { verifyAdminToken, signAdminToken, ACCESS_TOKEN_TTL_SECONDS } from './auth';
import { consumeRefreshToken, REFRESH_TOKEN_TTL_MS } from './session';
import { getAdminEmail, getAdminPassword } from './admin-config';

export const ADMIN_REFRESH_COOKIE = 'admin-refresh';

export async function ensureAdminUser(): Promise<void> {
  if (db.adminInitialized) return;

  const email = getAdminEmail();
  const existing = await getUserRepo().findByEmail(email);

  if (!existing || !existing.isAdmin) {
    const password = getAdminPassword();
    await getUserRepo().create({
      id: 'admin-1',
      name: 'Administrador',
      email,
      password: bcrypt.hashSync(password, 10),
      isAdmin: true,
      createdAt: new Date().toISOString(),
    });
  }

  db.adminInitialized = true;
}

export async function requireAdmin() {
  await ensureAdminUser();

  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;

  // Access token válido: usar directamente.
  if (token) {
    const payload = await verifyAdminToken(token);
    if (payload) {
      const user = await getUserRepo().findById(payload.userId);
      if (user?.isAdmin) return user;
      return null;
    }
  }

  // Access expirado: intentar renovar con el refresh token de admin (rotación).
  const refresh = cookieStore.get(ADMIN_REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const consumed = await consumeRefreshToken(refresh, 'admin');
  if (!consumed || !consumed.user.isAdmin) return null;

  const adminToken = await signAdminToken(consumed.user.id);
  const secure = process.env.NODE_ENV === 'production';
  cookieStore.set('admin-token', adminToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  cookieStore.set(ADMIN_REFRESH_COOKIE, consumed.newToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
  });

  return consumed.user;
}

export { verifyAdminToken, signAdminToken };