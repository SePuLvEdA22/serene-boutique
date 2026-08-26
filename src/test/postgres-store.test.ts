// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  PostgresStore,
  createNeonClient,
  type SqlClient,
} from '@/lib/store/postgres-store';
import type { User } from '@/lib/models';
import type { Product } from '@/lib/models';
import { DEFAULT_SETTINGS } from '@/lib/models/settings';

/**
 * Driver Postgres (Neon): verifica el mapeo modelo↔fila y que cada reemplazo
 * de colección sea un UPSERT + DELETE de ausentes dentro de UNA transacción.
 * Se usa un cliente SQL mockeado (no se toca ninguna base real).
 */

type Row = Record<string, unknown>;

interface RecordedQuery {
  text: string;
  params: unknown[];
}

function makeMockClient(rowsPerQuery: Row[][] = []) {
  const queries: RecordedQuery[] = [];
  const transactions: number[] = [];
  const client: SqlClient = {
    query(text: string, params: unknown[] = []): Promise<Row[]> {
      const index = queries.length;
      queries.push({ text, params });
      return Promise.resolve(rowsPerQuery[index] ?? []);
    },
    async transaction(pending): Promise<unknown> {
      transactions.push((pending as Promise<Row[]>[]).length);
      await Promise.all(pending);
      return [];
    },
  };
  return { client, queries, transactions };
}

beforeEach(() => {
  vi.stubEnv('STORE_DRIVER', 'memory');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createNeonClient', () => {
  it('debería_fallar_rápido_si_falta_DATABASE_URL', () => {
    vi.stubEnv('DATABASE_URL', '');
    expect(() => createNeonClient()).toThrow(/DATABASE_URL/);
    vi.unstubAllEnvs();
  });

  it('debería_crear_el_cliente_con_un_connection_string', () => {
    const client = createNeonClient(
      'postgresql://user:pass@ep-test-pooler.sa-east-1.aws.neon.tech/switchandtech?sslmode=require'
    );
    expect(typeof client.query).toBe('function');
    expect(typeof client.transaction).toBe('function');
  });
});

describe('PostgresStore.setUsers', () => {
  const user: User = {
    id: 'u-1',
    name: 'Ana',
    email: 'ana@example.com',
    password: '$2b$10$hash',
    isAdmin: false,
    createdAt: '2026-01-02T03:04:05.000Z',
    failedLoginAttempts: 0,
  };

  it('debería_hacer_upsert_y_delete_missing_en_una_sola_transacción', async () => {
    const mock = makeMockClient();
    const store = new PostgresStore(mock.client);

    await store.setUsers([user]);

    // Una transacción con 3 consultas: upsert users + delete missing + limpieza tokens
    expect(mock.transactions).toEqual([3]);
    expect(mock.queries).toHaveLength(3);
    expect(mock.queries[0].text).toContain('INSERT INTO users');
    expect(mock.queries[0].text).toContain('ON CONFLICT (id) DO UPDATE');
    // Parámetros en orden de columnas del mapper
    expect(mock.queries[0].params.slice(0, 9)).toEqual([
      'u-1', 'Ana', 'ana@example.com', '$2b$10$hash', false, null, 0, null,
      '2026-01-02T03:04:05.000Z',
    ]);
    expect(mock.queries[1].text).toContain('DELETE FROM users WHERE id NOT IN ($1)');
    expect(mock.queries[1].params).toEqual(['u-1']);
    // Sin tokens en el payload → limpieza total de la tabla de tokens
    expect(mock.queries[2].text).toBe('DELETE FROM refresh_tokens');
  });

  it('debería_sincronizar_los_refresh_tokens_por_hash', async () => {
    const mock = makeMockClient();
    const store = new PostgresStore(mock.client);

    await store.setUsers([
      {
        ...user,
        refreshTokens: [
          {
            hash: 'a'.repeat(64),
            kind: 'admin',
            expiresAt: '2026-12-01T00:00:00.000Z',
            createdAt: '2026-08-01T00:00:00.000Z',
          },
        ],
      },
    ]);

    const tokenUpsert = mock.queries.find((q) => q.text.includes('INSERT INTO refresh_tokens'));
    expect(tokenUpsert).toBeDefined();
    expect(tokenUpsert!.text).toContain('ON CONFLICT (hash) DO UPDATE');
    expect(tokenUpsert!.params).toEqual([
      'a'.repeat(64), 'admin', 'u-1',
      '2026-12-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z',
    ]);
    // Limpieza selectiva por hash, no total
    const staleDelete = mock.queries.find((q) => q.text.includes('DELETE FROM refresh_tokens'));
    expect(staleDelete!.text).toContain('NOT IN ($1)');
    expect(staleDelete!.params).toEqual(['a'.repeat(64)]);
  });

  it('debería_eliminar_todas_las_filas_si_la_colección_queda_vacía', async () => {
    const mock = makeMockClient();
    const store = new PostgresStore(mock.client);

    await store.setUsers([]);

    // Una transacción: DELETE users + DELETE tokens (sin upserts)
    expect(mock.transactions).toEqual([2]);
    expect(mock.queries.some((q) => q.text === 'DELETE FROM users')).toBe(true);
    expect(mock.queries.some((q) => q.text.includes('INSERT INTO'))).toBe(false);
  });
});

describe('PostgresStore.getUsers', () => {
  it('debería_mapear_snake_case_a_modelo_y_adjuntar_los_tokens', async () => {
    const mock = makeMockClient([
      [
        {
          id: 'u-1',
          name: 'Ana',
          email: 'ana@example.com',
          password: '$2b$10$hash',
          is_admin: true,
          consent_at: new Date('2026-01-05T00:00:00Z'),
          failed_login_attempts: '2',
          lockout_until: null,
          created_at: new Date('2026-01-02T03:04:05Z'),
        },
      ],
      [
        {
          id: '9',
          user_id: 'u-1',
          hash: 'b'.repeat(64),
          kind: 'user',
          expires_at: new Date('2026-12-01T00:00:00Z'),
          created_at: new Date('2026-08-01T00:00:00Z'),
        },
      ],
    ]);
    const store = new PostgresStore(mock.client);

    const users = await store.getUsers();

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      id: 'u-1',
      isAdmin: true,
      email: 'ana@example.com',
      failedLoginAttempts: 2,
      consentAt: '2026-01-05T00:00:00.000Z',
      lockoutUntil: undefined,
      createdAt: '2026-01-02T03:04:05.000Z',
    });
    expect(users[0].refreshTokens?.[0].hash).toBe('b'.repeat(64));
    expect(users[0].refreshTokens?.[0].kind).toBe('user');
  });
});

describe('PostgresStore.getProducts / setProducts', () => {
  it('debería_convertir_NUMERIC_a_number_y_JSONB_a_arrays', async () => {
    const mock = makeMockClient([
      [
        {
          id: 'p-1',
          name: 'Funda',
          description: 'Desc',
          price: '249000',
          sale_price: '199000',
          images: ['/img/a.webp'],
          image: null,
          category: 'fundas',
          featured: true,
          active: true,
          colors: ['rosa'],
          tags: null,
          stock: '10',
          created_at: new Date('2026-01-02T03:04:05Z'),
        },
      ],
    ]);
    const store = new PostgresStore(mock.client);

    const products = await store.getProducts();

    expect(products[0].price).toBe(249000);
    expect(products[0].salePrice).toBe(199000);
    expect(products[0].stock).toBe(10);
    expect(products[0].images).toEqual(['/img/a.webp']);
    expect(products[0].colors).toEqual(['rosa']);
    expect(products[0].tags).toBeUndefined();
  });

  it('debería_serializar_arrays_como_jsonb_en_el_upsert', async () => {
    const mock = makeMockClient();
    const product: Product = {
      id: 'p-1',
      name: 'Funda',
      description: '',
      price: 249000,
      images: ['/img/a.webp'],
      category: 'fundas',
      featured: false,
      active: true,
      colors: [],
      tags: ['nuevo'],
      createdAt: '2026-01-02T03:04:05.000Z',
    };
    const store = new PostgresStore(mock.client);

    await store.setProducts([product]);

    expect(mock.transactions).toEqual([2]); // una transacción: upsert + delete missing
    const upsert = mock.queries.find((q) => q.text.includes('INSERT INTO products'));
    expect(upsert!.text).toContain('$6::jsonb'); // images
    expect(upsert!.params[5]).toBe(JSON.stringify(['/img/a.webp']));
    expect(upsert!.text).toContain('$11::jsonb'); // colors
    expect(upsert!.text).toContain('$12::jsonb'); // tags
  });
});

describe('PostgresStore settings', () => {
  it('debería_devolver_defaults_cuando_no_hay_fila', async () => {
    const mock = makeMockClient([]);
    const store = new PostgresStore(mock.client);
    expect(await store.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('debería_mezclar_la_fila_guardada_con_los_defaults', async () => {
    const mock = makeMockClient([[{ data: { storeName: 'Mi Tienda' } }]]);
    const store = new PostgresStore(mock.client);

    const settings = await store.getSettings();

    expect(settings.storeName).toBe('Mi Tienda');
    expect(settings.supportEmail).toBe(DEFAULT_SETTINGS.supportEmail);
  });

  it('debería_caer_a_defaults_si_la_fila_está_corrupta', async () => {
    const mock = makeMockClient([[{ data: { shippingCost: 'no-es-número' } }]]);
    const store = new PostgresStore(mock.client);
    expect(await store.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('debería_escribir_settings_como_documento_único_id_1', async () => {
    const mock = makeMockClient();
    const store = new PostgresStore(mock.client);

    await store.setSettings({ ...DEFAULT_SETTINGS, storeName: 'X' });

    expect(mock.transactions).toHaveLength(0); // consulta única, sin transacción
    expect(mock.queries[0].text).toContain('INSERT INTO app_settings (id, data)');
    expect(mock.queries[0].text).toContain('ON CONFLICT (id) DO UPDATE');
    expect(mock.queries[0].params).toEqual([JSON.stringify({ ...DEFAULT_SETTINGS, storeName: 'X' })]);
  });
});

describe('reemplazo de colecciones vacías', () => {
  it('debería_borrar_todo_sin_upsert_para_orders_vacías', async () => {
    const mock = makeMockClient();
    const store = new PostgresStore(mock.client);

    await store.setOrders([]);

    expect(mock.queries).toHaveLength(1);
    expect(mock.queries[0].text).toBe('DELETE FROM orders');
  });

  it('debería_mantener_adminInitialized_en_memoria', () => {
    const store = new PostgresStore(makeMockClient().client);
    expect(store.getAdminInitialized()).toBe(false);
    store.setAdminInitialized(true);
    expect(store.getAdminInitialized()).toBe(true);
  });
});

describe('PostgresStore.tryIncrementPromoUsage', () => {
  const promoRow: Row = {
    id: 'promo-1',
    code: 'BIENVENIDA10',
    type: 'percent',
    value: '10',
    min_order: '0',
    active: true,
    usage_limit: '2',
    used_count: '1',
    expires_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  it('debería_usar_un_UPDATE_atómico_con_guard_de_límite_y_RETURNING', async () => {
    const mock = makeMockClient([[promoRow]]);
    const store = new PostgresStore(mock.client);

    const updated = await store.tryIncrementPromoUsage('promo-1');

    expect(mock.queries).toHaveLength(1);
    const text = mock.queries[0].text;
    // El guard de límite vive en el WHERE (no hay carrera posible)
    expect(text).toContain('used_count = used_count + 1');
    expect(text).toContain('usage_limit IS NULL OR used_count < usage_limit');
    expect(text).toContain('RETURNING *');
    expect(mock.queries[0].params).toEqual(['promo-1']);
    expect(updated).toBeDefined();
    expect(updated!.usedCount).toBe(1);
  });

  it('debería_devolver_undefined_cuando_el_guard_rechaza_(límite_agotado)', async () => {
    // Sin RETURNING rows → el UPDATE no tocó ninguna fila
    const mock = makeMockClient([[]]);
    const store = new PostgresStore(mock.client);

    const result = await store.tryIncrementPromoUsage('promo-1');

    expect(result).toBeUndefined();
  });

  it('debería_devolver_undefined_cuando_el_cupón_no_existe', async () => {
    const mock = makeMockClient([[]]);
    const store = new PostgresStore(mock.client);
    expect(await store.tryIncrementPromoUsage('no-existe')).toBeUndefined();
  });
});
