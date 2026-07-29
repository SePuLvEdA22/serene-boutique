import { getStore } from './store';
import type { StoreUser, StoreOrder, Contact, Subscriber } from './store/types';
import type { Product } from '@/lib/models';

export type { StoreUser, StoreOrder, Contact, Subscriber };

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
    contacts: collection<Contact>(
      () => s.getContacts(),
      (v) => s.setContacts(v),
    ),
    subscribers: collection<Subscriber>(
      () => s.getSubscribers(),
      (v) => s.setSubscribers(v),
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
