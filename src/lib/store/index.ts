import type { DataStore } from './types';
import { LowdbStore } from './lowdb-store';
import { MemoryStore } from './memory-store';
import { PostgresStore, createNeonClient } from './postgres-store';

export type StoreDriver = 'lowdb' | 'memory' | 'postgres';

let storeInstance: DataStore | null = null;

function normalizeDriver(value: string | undefined): StoreDriver | undefined {
  const v = value?.trim().toLowerCase();
  if (v === 'postgres' || v === 'memory' || v === 'lowdb') return v;
  return undefined;
}

export function getStore(driver?: StoreDriver): DataStore {
  if (!storeInstance) {
    const selected = driver ?? normalizeDriver(process.env.STORE_DRIVER) ?? 'lowdb';
    // Log redacted: nunca exponer DATABASE_URL ni contenido de tablas
    if (process.env.NODE_ENV === 'production' && selected !== 'postgres') {
      console.warn('[store] driver no es postgres — persistencia efímera (verifica STORE_DRIVER=postgres en Vercel Production y redeploy)');
    } else if (process.env.NODE_ENV === 'production' && selected === 'postgres' && !process.env.DATABASE_URL) {
      console.error('[store] STORE_DRIVER=postgres pero DATABASE_URL no está configurada');
    }
    switch (selected) {
      case 'memory':
        storeInstance = new MemoryStore();
        break;
      case 'postgres':
        // createNeonClient falla rápido si falta DATABASE_URL.
        storeInstance = new PostgresStore(createNeonClient());
        break;
      case 'lowdb':
      default:
        storeInstance = new LowdbStore();
        break;
    }
  }
  return storeInstance;
}

/** Solo para tests: descarta la instancia singleton para re-crearla. */
export function resetStore(): void {
  storeInstance = null;
}

export type { DataStore, StoreUser, StoreOrder, StoreData } from './types';
