import { getStore } from './store';
import type { StoreUser, StoreOrder, StoreData } from './store/types';
import type { Product } from '@/types';

export type { StoreUser, StoreOrder, StoreData };

function collection<T>(get: () => T[], set: (v: T[]) => void) {
  return { get, set };
}

function getStoreInstance() {
  const s = getStore();
  return {
    users: collection<StoreUser>(
      () => s.getUsers(),
      (v) => s.setUsers(v),
    ),
    products: collection<Product>(
      () => s.getProducts(),
      (v) => s.setProducts(v),
    ),
    orders: collection<StoreOrder>(
      () => s.getOrders(),
      (v) => s.setOrders(v),
    ),
    get adminInitialized(): boolean {
      return s.getAdminInitialized();
    },
    set adminInitialized(val: boolean) {
      s.setAdminInitialized(val);
    },
  };
}

export const db = getStoreInstance();
