import type { DataStore, StoreData, StoreUser, StoreOrder, Contact, Subscriber, StoreSettings, StorePromo } from './types';
import { initialProducts } from '@/lib/product-data';
import type { Product } from '@/lib/models';
import { DEFAULT_SETTINGS } from '@/lib/models/settings';

function defaultData(): StoreData {
  return {
    users: [],
    products: [...initialProducts] as Product[],
    orders: [],
    contacts: [],
    subscribers: [],
    settings: DEFAULT_SETTINGS,
    promos: [],
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
  getContacts(): Contact[] { return this.data.contacts; }
  setContacts(contacts: Contact[]): void { this.data.contacts = contacts; }
  getSubscribers(): Subscriber[] { return this.data.subscribers; }
  setSubscribers(subscribers: Subscriber[]): void { this.data.subscribers = subscribers; }
  getSettings(): StoreSettings { return this.data.settings; }
  setSettings(settings: StoreSettings): void { this.data.settings = settings; }
  getPromos(): StorePromo[] { return this.data.promos; }
  setPromos(promos: StorePromo[]): void { this.data.promos = promos; }
  getAdminInitialized(): boolean { return this._adminInitialized; }
  setAdminInitialized(val: boolean): void { this._adminInitialized = val; }
}