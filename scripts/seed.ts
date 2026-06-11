/**
 * Seed script — run with: npx tsx scripts/seed.ts
 *
 * Seeds the admin user from environment variables.
 * The database is auto-seeded with products on first access.
 */
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@switchandtech.mx';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  console.log(`Admin email: ${ADMIN_EMAIL}`);

  const { getStore } = await import('../src/lib/store');
  const store = getStore();
  const users = store.getUsers();

  const existing = users.find((u) => u.email === ADMIN_EMAIL && u.isAdmin);
  if (existing) {
    console.log('Admin user already exists. Skipping.');
    return;
  }

  store.setUsers([
    ...users,
    {
      id: 'admin-1',
      name: 'Administrador',
      email: ADMIN_EMAIL,
      password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
      isAdmin: true,
    },
  ]);

  store.setAdminInitialized(true);
  console.log('Admin user created successfully.');
}

main().catch(console.error);
