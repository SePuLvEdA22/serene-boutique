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
    promos: {
      get(): Promise<StorePromo[]> {
        return s.getPromos();
      },
      set(v: StorePromo[]): Promise<void> {
        return s.setPromos(v);
      },
      /** Incremento atómico con guard de usageLimit (delega en el driver). */
      tryIncrement(id: string): Promise<StorePromo | undefined> {
        return s.tryIncrementPromoUsage(id);
      },
    },
    get adminInitialized(): boolean {
      return s.getAdminInitialized();
    },
    set adminInitialized(val: boolean) {
      s.setAdminInitialized(val);
    },
  };
}

export const db = getStoreInstance();
