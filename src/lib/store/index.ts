import type { DataStore } from './types';
import { LowdbStore } from './lowdb-store';
import { MemoryStore } from './memory-store';
import { PostgresStore, createNeonClient } from './postgres-store';

export type StoreDriver = 'lowdb' | 'memory' | 'postgres';

let storeInstance: DataStore | null = null;

export function getStore(driver?: StoreDriver): DataStore {
  if (!storeInstance) {
    const selected = driver ?? (process.env.STORE_DRIVER as StoreDriver | undefined) ?? 'lowdb';
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
