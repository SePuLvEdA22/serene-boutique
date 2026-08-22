/**
 * Migración a Neon (Postgres serverless) — run with:
 *
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-neon.ts            # esquema + datos
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-neon.ts --schema   # solo esquema
 *
 * 1. Ejecuta el esquema idempotente (scripts/schema-neon.sql).
 * 2. Importa los datos actuales de data/db.json (si existe) a las tablas.
 */
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const schemaOnly = process.argv.includes('--schema');

  const { createNeonClient } = await import('../src/lib/store/postgres-store');
  const client = createNeonClient();

  // ── 1. Esquema (CREATE TABLE IF NOT EXISTS → seguro de re-ejecutar) ──
  const schemaPath = path.join(process.cwd(), 'scripts', 'schema-neon.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.split('\n').every((line) => line.trim().startsWith('--')));

  console.log(`Ejecutando esquema (${statements.length} sentencias)...`);
  for (const stmt of statements) {
    await client.query(stmt, []);
  }
  console.log('✅ Esquema listo.');

  if (schemaOnly) return;

  // ── 2. Datos desde data/db.json (lowdb) ──
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.log('ℹ️  No existe data/db.json — nada que importar.');
    return;
  }

  const { default: rawData } = await import(dbPath.toString());
  const data = rawData as {
    users?: unknown[];
    products?: unknown[];
    orders?: unknown[];
    contacts?: unknown[];
    subscribers?: unknown[];
    settings?: Record<string, unknown>;
    promos?: unknown[];
  };

  const { resetStore, getStore } = await import('../src/lib/store');
  process.env.STORE_DRIVER = 'postgres';
  resetStore();
  const store = getStore();

  let imported = 0;
  if (Array.isArray(data.users) && data.users.length > 0) {
    await store.setUsers(data.users as never);
    imported += data.users.length;
    console.log(`  users: ${data.users.length}`);
  }
  if (Array.isArray(data.products) && data.products.length > 0) {
    await store.setProducts(data.products as never);
    imported += data.products.length;
    console.log(`  products: ${data.products.length}`);
  }
  if (Array.isArray(data.orders) && data.orders.length > 0) {
    await store.setOrders(data.orders as never);
    imported += data.orders.length;
    console.log(`  orders: ${data.orders.length}`);
  }
  if (Array.isArray(data.contacts) && data.contacts.length > 0) {
    await store.setContacts(data.contacts as never);
    imported += data.contacts.length;
    console.log(`  contacts: ${data.contacts.length}`);
  }
  if (Array.isArray(data.subscribers) && data.subscribers.length > 0) {
    await store.setSubscribers(data.subscribers as never);
    imported += data.subscribers.length;
    console.log(`  subscribers: ${data.subscribers.length}`);
  }
  if (Array.isArray(data.promos) && data.promos.length > 0) {
    await store.setPromos(data.promos as never);
    imported += data.promos.length;
    console.log(`  promos: ${data.promos.length}`);
  }
  if (data.settings && typeof data.settings === 'object') {
    await store.setSettings(data.settings as never);
    console.log('  settings: 1');
  }

  console.log(`✅ Importación completa (${imported} registros).`);
}

main().catch((err) => {
  console.error('❌ Error en la migración:', err instanceof Error ? err.message : err);
  process.exit(1);
});
