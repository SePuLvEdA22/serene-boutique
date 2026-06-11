import type { DataStore } from './types';
import { LowdbStore } from './lowdb-store';
import { MemoryStore } from './memory-store';

let storeInstance: DataStore | null = null;

export function getStore(driver?: 'lowdb' | 'memory'): DataStore {
  if (!storeInstance) {
    const useLowdb = driver ?? process.env.STORE_DRIVER ?? 'lowdb';
    storeInstance = useLowdb === 'memory' ? new MemoryStore() : new LowdbStore();
  }
  return storeInstance;
}

export function resetStore(): void {
  storeInstance = null;
}

export type { DataStore, StoreUser, StoreOrder, StoreData } from './types';
