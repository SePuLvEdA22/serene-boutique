import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { getUserRepo } from './repositories';
import { verifyAdminToken, signAdminToken } from './auth';
import {
  consumeRefreshToken,
  setSessionCookiePair,
  ADMIN_COOKIE,
  ADMIN_REFRESH_COOKIE,
} from './session';
import { getAdminEmail, getAdminPassword } from './admin-config';

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
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

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
  setSessionCookiePair(cookieStore, 'admin', adminToken, consumed.newToken);

  return consumed.user;
}

export { verifyAdminToken, signAdminToken };