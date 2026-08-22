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

  async getUsers(): Promise<StoreUser[]> { return this.data.users; }
  async setUsers(users: StoreUser[]): Promise<void> { this.data.users = users; }
  async getProducts(): Promise<Product[]> { return this.data.products; }
  async setProducts(products: Product[]): Promise<void> { this.data.products = products; }
  async getOrders(): Promise<StoreOrder[]> { return this.data.orders; }
  async setOrders(orders: StoreOrder[]): Promise<void> { this.data.orders = orders; }
  async getContacts(): Promise<Contact[]> { return this.data.contacts; }
  async setContacts(contacts: Contact[]): Promise<void> { this.data.contacts = contacts; }
  async getSubscribers(): Promise<Subscriber[]> { return this.data.subscribers; }
  async setSubscribers(subscribers: Subscriber[]): Promise<void> { this.data.subscribers = subscribers; }
  async getSettings(): Promise<StoreSettings> { return this.data.settings; }
  async setSettings(settings: StoreSettings): Promise<void> { this.data.settings = settings; }
  async getPromos(): Promise<StorePromo[]> { return this.data.promos; }
  async setPromos(promos: StorePromo[]): Promise<void> { this.data.promos = promos; }
  getAdminInitialized(): boolean { return this._adminInitialized; }
  setAdminInitialized(val: boolean): void { this._adminInitialized = val; }
}