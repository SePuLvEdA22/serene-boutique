import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { verifyAdminToken, signAdminToken } from './auth';

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || 'admin@switchandtech.mx';
}

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

export function ensureAdminUser() {
  if (db.adminInitialized) return;

  const email = getAdminEmail();
  const existing = db.users.get().find((u) => u.email === email && u.isAdmin);

  if (!existing) {
    const password = getAdminPassword();
    db.users.get().push({
      id: 'admin-1',
      name: 'Administrador',
      email,
      password: bcrypt.hashSync(password, 10),
      isAdmin: true,
    });
  }

  db.adminInitialized = true;
}

export async function requireAdmin() {
  ensureAdminUser();

  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;

  if (!token) return null;

  const payload = await verifyAdminToken(token);
  if (!payload) return null;

  const user = db.users.get().find((u) => u.id === payload.userId && u.isAdmin);
  return user || null;
}

export { verifyAdminToken, signAdminToken };
