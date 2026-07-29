import type { Product } from '@/lib/models';
import type { User } from '@/lib/models';
import type { Order } from '@/lib/models';
import type { Contact } from '@/lib/models';
import type { Subscriber } from '@/lib/models';

export type { Product, User as StoreUser, Order as StoreOrder, Contact, Subscriber };

export interface StoreData {
  users: User[];
  products: Product[];
  orders: Order[];
  contacts: Contact[];
  subscribers: Subscriber[];
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
  getAdminInitialized(): boolean;
  setAdminInitialized(val: boolean): void;
}
