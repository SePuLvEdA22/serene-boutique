import type { Product } from '@/types';
import type { DataStore, StoreData, StoreUser, StoreOrder } from './types';
import { initialProducts } from '@/lib/product-data';

function defaultData(): StoreData {
  return {
    users: [],
    products: [...initialProducts],
    orders: [],
  };
}

export class MemoryStore implements DataStore {
  private data: StoreData;
  private _adminInitialized = false;

  constructor() {
    const g = globalThis as Record<string, unknown>;
    if (!g.__store_data) {
      g.__store_data = defaultData();
    }
    this.data = g.__store_data as StoreData;
    if (typeof g.__adminInitialized === 'boolean') {
      this._adminInitialized = g.__adminInitialized;
    }
  }

  getUsers(): StoreUser[] { return this.data.users; }
  setUsers(users: StoreUser[]): void { this.data.users = users; }
  getProducts(): Product[] { return this.data.products; }
  setProducts(products: Product[]): void { this.data.products = products; }
  getOrders(): StoreOrder[] { return this.data.orders; }
  setOrders(orders: StoreOrder[]): void { this.data.orders = orders; }
  getAdminInitialized(): boolean { return this._adminInitialized; }
  setAdminInitialized(val: boolean): void { this._adminInitialized = val; }
}
