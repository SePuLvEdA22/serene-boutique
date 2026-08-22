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
  getUsers(): Promise<User[]>;
  setUsers(users: User[]): Promise<void>;
  getProducts(): Promise<Product[]>;
  setProducts(products: Product[]): Promise<void>;
  getOrders(): Promise<Order[]>;
  setOrders(orders: Order[]): Promise<void>;
  getContacts(): Promise<Contact[]>;
  setContacts(contacts: Contact[]): Promise<void>;
  getSubscribers(): Promise<Subscriber[]>;
  setSubscribers(subscribers: Subscriber[]): Promise<void>;
  getSettings(): Promise<Settings>;
  setSettings(settings: Settings): Promise<void>;
  getPromos(): Promise<Promo[]>;
  setPromos(promos: Promo[]): Promise<void>;
  getAdminInitialized(): boolean;
  setAdminInitialized(val: boolean): void;
}
