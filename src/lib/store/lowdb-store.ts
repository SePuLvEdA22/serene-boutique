import path from 'path';
import { JSONFileSyncPreset } from 'lowdb/node';
import type { DataStore, StoreData, StoreUser, StoreOrder, Contact, Subscriber, StoreSettings, StorePromo } from './types';
import { initialProducts } from '@/lib/product-data';
import type { Product } from '@/lib/models';
import { DEFAULT_SETTINGS } from '@/lib/models/settings';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export class LowdbStore implements DataStore {
  private db: ReturnType<typeof JSONFileSyncPreset<StoreData>>;
  private _adminInitialized = false;

  constructor() {
    const defaults: StoreData = {
      users: [],
      products: [...initialProducts] as Product[],
      orders: [],
      contacts: [],
      subscribers: [],
      settings: DEFAULT_SETTINGS,
      promos: [],
    };
    this.db = JSONFileSyncPreset(DB_PATH, defaults);
    this.db.read();
    if (!this.db.data.settings) {
      this.db.data.settings = DEFAULT_SETTINGS;
      this.persist();
    }
    if (!this.db.data.promos) {
      this.db.data.promos = [];
      this.persist();
    }
  }

  private persist(): void {
    try { this.db.write(); } catch { /* file write error */ }
  }

  getUsers(): StoreUser[] { return this.db.data.users; }
  setUsers(users: StoreUser[]): void { this.db.data.users = users; this.persist(); }
  getProducts(): Product[] { return this.db.data.products; }
  setProducts(products: Product[]): void { this.db.data.products = products; this.persist(); }
  getOrders(): StoreOrder[] { return this.db.data.orders; }
  setOrders(orders: StoreOrder[]): void { this.db.data.orders = orders; this.persist(); }
  getContacts(): Contact[] { return this.db.data.contacts; }
  setContacts(contacts: Contact[]): void { this.db.data.contacts = contacts; this.persist(); }
  getSubscribers(): Subscriber[] { return this.db.data.subscribers; }
  setSubscribers(subscribers: Subscriber[]): void { this.db.data.subscribers = subscribers; this.persist(); }
  getSettings(): StoreSettings { return this.db.data.settings; }
  setSettings(settings: StoreSettings): void { this.db.data.settings = settings; this.persist(); }
  getPromos(): StorePromo[] { return this.db.data.promos; }
  setPromos(promos: StorePromo[]): void { this.db.data.promos = promos; this.persist(); }
  getAdminInitialized(): boolean { return this._adminInitialized; }
  setAdminInitialized(val: boolean): void { this._adminInitialized = val; }
}