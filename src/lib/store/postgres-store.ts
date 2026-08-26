import { neon } from '@neondatabase/serverless';
import type {
  DataStore,
  StoreOrder,
  Contact,
  Subscriber,
  StoreSettings,
  StorePromo,
} from './types';
import type { Product, User } from '@/lib/models';
import { DEFAULT_SETTINGS, SettingsSchema } from '@/lib/models/settings';

type Row = Record<string, unknown>;

/** Consulta "pendiente" producida por `query()`: awaitable y válida dentro de una transacción. */
export type PendingQuery = Promise<Row[]>;

/**
 * Cliente SQL mínimo que necesita el store.
 * Lo satisface el cliente HTTP de Neon (`neon()`) y el mock de los tests.
 * Las consultas son siempre parametrizadas ($1, $2, ...) — nunca se concatena
 * input de usuario en el SQL (ver NEON-DB.md, sección Seguridad).
 */
export interface SqlClient {
  /** Programa una consulta parametrizada y devuelve su fila de resultados. */
  query(text: string, params?: unknown[]): PendingQuery;
  /**
   * Ejecuta las consultas pendientes como UNA transacción (todo o nada).
   * Se usa para que cada reemplazo de colección sea atómico: sin él, un error
   * a mitad de sincronización dejaría la tabla inconsistente.
   */
  transaction(queries: PendingQuery[]): Promise<unknown>;
}

/**
 * Crea el cliente HTTP serverless de Neon.
 *
 * Se usa `neon()` (HTTP, sin pool de conexiones) en vez de Pool/WebSocket porque
 * en Vercel cada función es efímera: no hay conexiones que reutilizar ni límites
 * que agotar, y funciona directamente contra el endpoint *pooled* de Neon.
 */
export function createNeonClient(connectionString = process.env.DATABASE_URL): SqlClient {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no está configurado. Defínelo en las variables de entorno antes de usar STORE_DRIVER=postgres.'
    );
  }
  const sql = neon(connectionString);
  return {
    query: (text, params) => sql.query(text, params ?? []) as Promise<Row[]>,
    transaction: (queries) => sql.transaction(queries as never) as Promise<unknown>,
  };
}

/* ---------------------------------- helpers ---------------------------------- */

/** Normaliza un valor temporal de Postgres (Date | string | null) a ISO o undefined. */
function toIso(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value) || undefined;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Convierte NUMERIC (que Postgres devuelve como texto) a number, o undefined si es NULL. */
function toNum(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Genera los grupos de placeholders VALUES: ['($1,$2)', '($3,$4)', ...].
 * `jsonbCols` recibe los índices (0-based) de las columnas JSONB para
 * emitirlos como `$n::jsonb` y que Postgres coercione el texto JSON.
 */
function valueGroups(rowCount: number, colCount: number, jsonbCols: number[] = []): string[] {
  const groups: string[] = [];
  for (let r = 0; r < rowCount; r++) {
    const start = r * colCount;
    const ph: string[] = [];
    for (let c = 0; c < colCount; c++) {
      ph.push(`$${start + c + 1}${jsonbCols.includes(c) ? '::jsonb' : ''}`);
    }
    groups.push(`(${ph.join(', ')})`);
  }
  return groups;
}

/**
 * DELETE de las filas cuyo id NO esté en la lista recibida (o todas si está vacía).
 * Complementa al UPSERT para replicar la semántica de lowdb: `setX(lista)` reemplaza
 * TODA la colección, así que las filas que ya no están deben eliminarse.
 */
function deleteMissingById(table: string, ids: string[]): { text: string; params: string[] } {
  if (ids.length === 0) return { text: `DELETE FROM ${table}`, params: [] };
  const ph = ids.map((_, i) => `$${i + 1}`).join(', ');
  return { text: `DELETE FROM ${table} WHERE id NOT IN (${ph})`, params: ids };
}

/* ------------------------- mapeos modelo ↔ fila ------------------------- */

function userToParams(u: User): unknown[] {
  return [
    u.id,
    u.name,
    u.email,
    u.password,
    u.isAdmin ?? false,
    u.consentAt ?? null,
    u.failedLoginAttempts ?? 0,
    u.lockoutUntil ?? null,
    u.createdAt ?? nowIso(),
  ];
}
// prettier-ignore
const UPSERT_USERS = `
INSERT INTO users (id, name, email, password, is_admin, consent_at, failed_login_attempts, lockout_until, created_at)
VALUES @VALUES@
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password,
  is_admin = EXCLUDED.is_admin, consent_at = EXCLUDED.consent_at,
  failed_login_attempts = EXCLUDED.failed_login_attempts, lockout_until = EXCLUDED.lockout_until,
  created_at = EXCLUDED.created_at`;

function tokenToParams(userId: string, t: NonNullable<User['refreshTokens']>[number]): unknown[] {
  return [t.hash, t.kind, userId, t.expiresAt, t.createdAt];
}
// prettier-ignore
const UPSERT_TOKENS = `
INSERT INTO refresh_tokens (hash, kind, user_id, expires_at, created_at)
VALUES @VALUES@
ON CONFLICT (hash) DO UPDATE SET
  user_id = EXCLUDED.user_id, kind = EXCLUDED.kind,
  expires_at = EXCLUDED.expires_at, created_at = EXCLUDED.created_at`;

function productToParams(p: Product): unknown[] {
  return [
    p.id,
    p.name,
    p.description ?? '',
    p.price,
    p.salePrice ?? null,
    JSON.stringify(p.images ?? []),
    p.image ?? null,
    p.category,
    p.featured ?? false,
    p.active ?? true,
    JSON.stringify(p.colors ?? []),
    p.tags ? JSON.stringify(p.tags) : null,
    p.stock ?? null,
    p.createdAt ?? nowIso(),
  ];
}
// Los arrays/objetos van como $n::jsonb (Postgres coerciona el texto JSON).
// prettier-ignore
const UPSERT_PRODUCTS = `
INSERT INTO products (id, name, description, price, sale_price, images, image, category, featured, active, colors, tags, stock, created_at)
VALUES @VALUES@
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price, images = EXCLUDED.images, image = EXCLUDED.image,
  category = EXCLUDED.category, featured = EXCLUDED.featured, active = EXCLUDED.active,
  colors = EXCLUDED.colors, tags = EXCLUDED.tags, stock = EXCLUDED.stock,
  created_at = EXCLUDED.created_at`;

function orderToParams(o: StoreOrder): unknown[] {
  return [
    o.id,
    o.userId ?? null,
    JSON.stringify(o.items),
    JSON.stringify(o.shipping),
    o.total,
    o.discount ?? null,
    o.promoId ?? null,
    o.paymentMethod ?? null,
    o.mpPaymentId ?? null,
    o.mpPreferenceId ?? null,
    o.payerIdentification ? JSON.stringify(o.payerIdentification) : null,
    o.status ?? 'pending',
    o.createdAt ?? nowIso(),
  ];
}
// prettier-ignore
const UPSERT_ORDERS = `
INSERT INTO orders (id, user_id, items, shipping, total, discount, promo_id, payment_method, mp_payment_id, mp_preference_id, payer_identification, status, created_at)
VALUES @VALUES@
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id, items = EXCLUDED.items, shipping = EXCLUDED.shipping,
  total = EXCLUDED.total, discount = EXCLUDED.discount, promo_id = EXCLUDED.promo_id,
  payment_method = EXCLUDED.payment_method, mp_payment_id = EXCLUDED.mp_payment_id,
  mp_preference_id = EXCLUDED.mp_preference_id, payer_identification = EXCLUDED.payer_identification,
  status = EXCLUDED.status, created_at = EXCLUDED.created_at`;

function contactToParams(c: Contact): unknown[] {
  return [c.id, c.name, c.email, c.subject, c.message, c.read ?? false, c.createdAt ?? nowIso()];
}
// prettier-ignore
const UPSERT_CONTACTS = `
INSERT INTO contacts (id, name, email, subject, message, read, created_at)
VALUES @VALUES@
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, email = EXCLUDED.email, subject = EXCLUDED.subject,
  message = EXCLUDED.message, read = EXCLUDED.read, created_at = EXCLUDED.created_at`;

function subscriberToParams(s: Subscriber): unknown[] {
  return [s.id, s.email, s.subscribedAt ?? nowIso(), s.consentAt ?? null];
}
// prettier-ignore
const UPSERT_SUBSCRIBERS = `
INSERT INTO subscribers (id, email, subscribed_at, consent_at)
VALUES @VALUES@
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email, subscribed_at = EXCLUDED.subscribed_at, consent_at = EXCLUDED.consent_at`;

function promoToParams(p: StorePromo): unknown[] {
  return [
    p.id,
    p.code,
    p.type,
    p.value,
    p.minOrder ?? 0,
    p.active ?? true,
    p.usageLimit ?? null,
    p.usedCount ?? 0,
    p.expiresAt ?? null,
    p.createdAt ?? nowIso(),
  ];
}
// prettier-ignore
const UPSERT_PROMOS = `
INSERT INTO promos (id, code, type, value, min_order, active, usage_limit, used_count, expires_at, created_at)
VALUES @VALUES@
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code, type = EXCLUDED.type, value = EXCLUDED.value,
  min_order = EXCLUDED.min_order, active = EXCLUDED.active, usage_limit = EXCLUDED.usage_limit,
  used_count = EXCLUDED.used_count, expires_at = EXCLUDED.expires_at, created_at = EXCLUDED.created_at`;

/** Mapea una fila de `promos` al modelo (compartido por getPromos e incrementos atómicos). */
function promoFromRow(row: Row): StorePromo {
  return {
    id: String(row.id),
    code: String(row.code),
    type: row.type === 'fixed' ? ('fixed' as const) : ('percent' as const),
    value: toNum(row.value) ?? 0,
    minOrder: toNum(row.min_order) ?? 0,
    active: row.active !== false,
    usageLimit: toNum(row.usage_limit),
    usedCount: toNum(row.used_count) ?? 0,
    expiresAt: toIso(row.expires_at),
    createdAt: toIso(row.created_at) ?? nowIso(),
  };
}

/* ------------------------------- el store ------------------------------- */

/**
 * Driver de persistencia sobre Postgres (Neon) que implementa DataStore.
 *
 * Mantiene la MISMA semántica colección-completa de lowdb (`getX`/`setX`),
 * así que los repositorios no cambian su lógica: cada `setX(lista)` hace un
 * UPSERT de toda la lista + DELETE de las filas ausentes, todo en una
 * transacción atómica.
 *
 * DEUDA CONOCIDA: esta semántica reescribe la tabla completa por mutación
 * (O(n) writes por cambio). Las operaciones críticas de concurrencia (cupones)
 * usan `tryIncrementPromoUsage`, un UPDATE dirigido y atómico. El siguiente
 * paso natural sería migrar el resto a updates/upserts por fila.
 */
export class PostgresStore implements DataStore {
  private client: SqlClient;
  private _adminInitialized = false;

  constructor(client?: SqlClient) {
    this.client = client ?? createNeonClient();
  }

  /** Ejecuta upserts + deletes como una única transacción atómica. */
  private async syncTable(
    upserts: Array<{ text: string; params: unknown[] }>,
    deletes: Array<{ text: string; params: unknown[] }>
  ): Promise<void> {
    const queries: PendingQuery[] = [
      ...upserts.map((q) => this.client.query(q.text, q.params)),
      ...deletes.map((q) => this.client.query(q.text, q.params)),
    ];
    if (queries.length === 0) return;
    await this.client.transaction(queries);
  }

  /* ---- usuarios (+ refresh tokens en su tabla aparte) ---- */

  async getUsers(): Promise<User[]> {
    const rows = await this.client.query('SELECT * FROM users ORDER BY created_at ASC, id ASC');
    if (rows.length === 0) return [];

    const tokenRows = await this.client.query('SELECT * FROM refresh_tokens ORDER BY id ASC');
    const tokensByUser = new Map<string, NonNullable<User['refreshTokens']>>();
    for (const t of tokenRows) {
      const userId = String(t.user_id);
      const list = tokensByUser.get(userId) ?? [];
      list.push({
        hash: String(t.hash),
        kind: t.kind === 'admin' ? 'admin' : 'user',
        expiresAt: toIso(t.expires_at) ?? nowIso(),
        createdAt: toIso(t.created_at) ?? nowIso(),
      });
      tokensByUser.set(userId, list);
    }

    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      password: String(row.password),
      isAdmin: row.is_admin === true,
      createdAt: toIso(row.created_at),
      consentAt: toIso(row.consent_at),
      failedLoginAttempts: toNum(row.failed_login_attempts),
      lockoutUntil: toIso(row.lockout_until),
      refreshTokens: tokensByUser.get(String(row.id)),
    }));
  }

  async setUsers(users: User[]): Promise<void> {
    const upserts: Array<{ text: string; params: unknown[] }> = [];
    if (users.length > 0) {
      upserts.push({
        text: UPSERT_USERS.replace('@VALUES@', valueGroups(users.length, 9).join(', ')),
        params: users.flatMap(userToParams),
      });
    }

    const tokenRows: Array<{ text: string; params: unknown[] }> = [];
    const allTokens = users.flatMap((u) =>
      (u.refreshTokens ?? []).map((t) => ({ userId: u.id, token: t }))
    );
    if (allTokens.length > 0) {
      tokenRows.push({
        text: UPSERT_TOKENS.replace('@VALUES@', valueGroups(allTokens.length, 5).join(', ')),
        params: allTokens.flatMap(({ userId, token }) => tokenToParams(userId, token)),
      });
    }
    // Limpieza de sesiones: borra los hashes que ya no existen en el modelo.
    // Cubre tanto tokens revocados de usuarios vivos como los de usuarios
    // eliminados (aunque estos últimos también desaparecen por CASCADE).
    const hashes = allTokens.map(({ token }) => token.hash);
    const deleteStaleTokens =
      hashes.length > 0
        ? {
            text: `DELETE FROM refresh_tokens WHERE hash NOT IN (${hashes.map((_, i) => `$${i + 1}`).join(', ')})`,
            params: hashes,
          }
        : { text: 'DELETE FROM refresh_tokens', params: [] };

    await this.syncTable([...upserts, ...tokenRows], [deleteMissingById('users', users.map(u => u.id)), deleteStaleTokens]);
  }

  /* ---- productos ---- */

  async getProducts(): Promise<Product[]> {
    const rows = await this.client.query('SELECT * FROM products ORDER BY created_at ASC, id ASC');
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      description: String(row.description ?? ''),
      price: toNum(row.price) ?? 0,
      salePrice: toNum(row.sale_price),
      images: Array.isArray(row.images) ? (row.images as string[]) : [],
      image: row.image == null ? undefined : String(row.image),
      category: row.category as Product['category'],
      featured: row.featured === true,
      active: row.active !== false,
      colors: Array.isArray(row.colors) ? (row.colors as string[]) : [],
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : undefined,
      stock: toNum(row.stock),
      createdAt: toIso(row.created_at) ?? nowIso(),
    }));
  }

  async setProducts(products: Product[]): Promise<void> {
    const upserts =
      products.length > 0
        ? [
            {
              text: UPSERT_PRODUCTS.replace(
                '@VALUES@',
                valueGroups(products.length, 14, [5, 10, 11]).join(', ')
              ), // jsonb: images(5), colors(10), tags(11)
              params: products.flatMap(productToParams),
            },
          ]
        : [];
    await this.syncTable(upserts, [deleteMissingById('products', products.map((p) => p.id))]);
  }

  /* ---- órdenes ---- */

  async getOrders(): Promise<StoreOrder[]> {
    const rows = await this.client.query('SELECT * FROM orders ORDER BY created_at ASC, id ASC');
    return rows.map((row) => ({
      id: String(row.id),
      userId: row.user_id == null ? undefined : String(row.user_id),
      items: row.items as StoreOrder['items'],
      shipping: row.shipping as StoreOrder['shipping'],
      total: toNum(row.total) ?? 0,
      discount: toNum(row.discount),
      promoId: row.promo_id == null ? undefined : String(row.promo_id),
      paymentMethod: row.payment_method == null ? undefined : (String(row.payment_method) as StoreOrder['paymentMethod']),
      mpPaymentId: row.mp_payment_id == null ? undefined : String(row.mp_payment_id),
      mpPreferenceId: row.mp_preference_id == null ? undefined : String(row.mp_preference_id),
      payerIdentification: (row.payer_identification ?? undefined) as StoreOrder['payerIdentification'],
      status: (row.status ?? 'pending') as StoreOrder['status'],
      createdAt: toIso(row.created_at) ?? nowIso(),
    }));
  }

  async setOrders(orders: StoreOrder[]): Promise<void> {
    const upserts =
      orders.length > 0
        ? [
            {
              text: UPSERT_ORDERS.replace(
                '@VALUES@',
                valueGroups(orders.length, 13, [2, 3, 10]).join(', ')
              ), // jsonb: items(2), shipping(3), payer_identification(10)
              params: orders.flatMap(orderToParams),
            },
          ]
        : [];
    await this.syncTable(upserts, [deleteMissingById('orders', orders.map((o) => o.id))]);
  }

  /* ---- contactos ---- */

  async getContacts(): Promise<Contact[]> {
    const rows = await this.client.query('SELECT * FROM contacts ORDER BY created_at ASC, id ASC');
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      email: String(row.email),
      subject: String(row.subject),
      message: String(row.message),
      read: row.read === true,
      createdAt: toIso(row.created_at) ?? nowIso(),
    }));
  }

  async setContacts(contacts: Contact[]): Promise<void> {
    const upserts =
      contacts.length > 0
        ? [
            {
              text: UPSERT_CONTACTS.replace('@VALUES@', valueGroups(contacts.length, 7).join(', ')),
              params: contacts.flatMap(contactToParams),
            },
          ]
        : [];
    await this.syncTable(upserts, [deleteMissingById('contacts', contacts.map((c) => c.id))]);
  }

  /* ---- suscriptores ---- */

  async getSubscribers(): Promise<Subscriber[]> {
    const rows = await this.client.query('SELECT * FROM subscribers ORDER BY subscribed_at ASC, id ASC');
    return rows.map((row) => ({
      id: String(row.id),
      email: String(row.email),
      subscribedAt: toIso(row.subscribed_at) ?? nowIso(),
      consentAt: toIso(row.consent_at),
    }));
  }

  async setSubscribers(subscribers: Subscriber[]): Promise<void> {
    const upserts =
      subscribers.length > 0
        ? [
            {
              text: UPSERT_SUBSCRIBERS.replace('@VALUES@', valueGroups(subscribers.length, 4).join(', ')),
              params: subscribers.flatMap(subscriberToParams),
            },
          ]
        : [];
    await this.syncTable(upserts, [deleteMissingById('subscribers', subscribers.map((s) => s.id))]);
  }

  /* ---- configuración (documento único) ---- */

  async getSettings(): Promise<StoreSettings> {
    const rows = await this.client.query('SELECT data FROM app_settings WHERE id = 1');
    const raw = rows[0]?.data;
    if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
    try {
      // Mezcla con defaults para tolerar settings guardados con versión anterior.
      return SettingsSchema.parse({ ...DEFAULT_SETTINGS, ...(raw as Record<string, unknown>) });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async setSettings(settings: StoreSettings): Promise<void> {
    await this.client.query(
      'INSERT INTO app_settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
      [JSON.stringify(settings)]
    );
  }

  /* ---- cupones ---- */

  async getPromos(): Promise<StorePromo[]> {
    const rows = await this.client.query('SELECT * FROM promos ORDER BY created_at ASC, id ASC');
    return rows.map(promoFromRow);
  }

  async setPromos(promos: StorePromo[]): Promise<void> {
    const upserts =
      promos.length > 0
        ? [
            {
              text: UPSERT_PROMOS.replace('@VALUES@', valueGroups(promos.length, 10).join(', ')),
              params: promos.flatMap(promoToParams),
            },
          ]
        : [];
    await this.syncTable(upserts, [deleteMissingById('promos', promos.map((p) => p.id))]);
  }

  /**
   * Incremento atómico a nivel SQL: el guard de `usage_limit` vive en la
   * cláusula WHERE, así que dos transacciones concurrentes no pueden superar
   * el límite (Postgres serializa el UPDATE sobre la fila).
   */
  async tryIncrementPromoUsage(id: string): Promise<StorePromo | undefined> {
    const rows = await this.client.query(
      `UPDATE promos SET used_count = used_count + 1
       WHERE id = $1 AND (usage_limit IS NULL OR used_count < usage_limit)
       RETURNING *`,
      [id]
    );
    const row = rows[0];
    return row ? promoFromRow(row) : undefined;
  }

  /* ---- bandera de inicialización del admin ---- */

  /**
   * Igual que en LowdbStore: es una bandera EN MEMORIA por instancia de la
   * función serverless. Solo evita re-ejecutar el seed del admin varias veces
   * dentro del mismo proceso; la persistencia real vive en la tabla users.
   */
  getAdminInitialized(): boolean {
    return this._adminInitialized;
  }

  setAdminInitialized(val: boolean): void {
    this._adminInitialized = val;
  }
}
