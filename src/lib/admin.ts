import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from './db';

function getAdminUser() {
  return db.users.get().find(u => u.isAdmin);
}

export function ensureAdminUser() {
  const admin = getAdminUser();
  if (!admin) {
    db.users.get().push({
      id: 'admin-1',
      name: 'Administrador',
      email: 'admin@switchandtech.mx',
      password: bcrypt.hashSync('admin123', 10),
      isAdmin: true,
    });
  }
}

export async function requireAdmin() {
  ensureAdminUser();

  const cookieStore = await cookies();
  const token = cookieStore.get('admin-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = db.users.get().find(u => u.id === decoded.userId && u.isAdmin);
    return user || null;
  } catch {
    return null;
  }
}
