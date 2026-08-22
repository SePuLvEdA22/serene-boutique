import { getStore } from './store';
import type { StoreUser, StoreOrder, Contact, Subscriber, StoreSettings, StorePromo } from './store/types';
import type { Product } from '@/lib/models';

export type { StoreUser, StoreOrder, Contact, Subscriber, StoreSettings, StorePromo };

function collection<T>(get: () => Promise<T[]>, set: (v: T[]) => Promise<void>) {
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
    settings: {
      get(): Promise<StoreSettings> {
        return s.getSettings();
      },
      set(v: StoreSettings): Promise<void> {
        return s.setSettings(v);
      },
    },
    promos: collection<StorePromo>(
      () => s.getPromos(),
      (v) => s.setPromos(v),
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
