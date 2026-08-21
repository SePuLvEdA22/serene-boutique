import type { Product } from '@/lib/models';
import type { User } from '@/lib/models';
import type { Order } from '@/lib/models';
import type { Contact } from '@/lib/models';
import type { Subscriber } from '@/lib/models';
import type { Settings } from '@/lib/models/settings';
import type { Promo } from '@/lib/models/promo';

export type {
  Product,
  User as StoreUser,
  Order as StoreOrder,
  Contact,
  Subscriber,
  Settings as StoreSettings,
  Promo as StorePromo,
};

export interface StoreData {
  users: User[];
  products: Product[];
  orders: Order[];
  contacts: Contact[];
  subscribers: Subscriber[];
  settings: Settings;
  promos: Promo[];
}

export interface DataStore {
  getUsers(): User[];
  setUsers(users: User[]): void;
  getProducts(): Product[];
  setProducts(products: Product[]): void;
  getOrders(): Order[];
  setOrders(orders: Order[]): void;
  getContacts(): Contact[];
  setContacts(contacts: Contact[]): void;
  getSubscribers(): Subscriber[];
  setSubscribers(subscribers: Subscriber[]): void;
  getSettings(): Settings;
  setSettings(settings: Settings): void;
  getPromos(): Promo[];
  setPromos(promos: Promo[]): void;
  getAdminInitialized(): boolean;
  setAdminInitialized(val: boolean): void;
}
