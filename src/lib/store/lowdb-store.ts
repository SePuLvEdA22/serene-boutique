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
  /** Serializa los incrementos atómicos de cupones dentro del proceso. */
  private promoMutex: Promise<unknown> = Promise.resolve();

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

  async getUsers(): Promise<StoreUser[]> { return this.db.data.users; }
  async setUsers(users: StoreUser[]): Promise<void> { this.db.data.users = users; this.persist(); }
  async getProducts(): Promise<Product[]> { return this.db.data.products; }
  async setProducts(products: Product[]): Promise<void> { this.db.data.products = products; this.persist(); }
  async getOrders(): Promise<StoreOrder[]> { return this.db.data.orders; }
  async setOrders(orders: StoreOrder[]): Promise<void> { this.db.data.orders = orders; this.persist(); }
  async getContacts(): Promise<Contact[]> { return this.db.data.contacts; }
  async setContacts(contacts: Contact[]): Promise<void> { this.db.data.contacts = contacts; this.persist(); }
  async getSubscribers(): Promise<Subscriber[]> { return this.db.data.subscribers; }
  async setSubscribers(subscribers: Subscriber[]): Promise<void> { this.db.data.subscribers = subscribers; this.persist(); }
  async getSettings(): Promise<StoreSettings> { return this.db.data.settings; }
  async setSettings(settings: StoreSettings): Promise<void> { this.db.data.settings = settings; this.persist(); }
  async getPromos(): Promise<StorePromo[]> { return this.db.data.promos; }
  async setPromos(promos: StorePromo[]): Promise<void> { this.db.data.promos = promos; this.persist(); }

  /**
   * Incremento atómico con guard de `usageLimit`. El mutex de promesa
   * encadenada serializa las llamadas concurrentes dentro del proceso:
   * el segundo checkout ve el `usedCount` ya incrementado por el primero.
   */
  tryIncrementPromoUsage(id: string): Promise<StorePromo | undefined> {
    const run = this.promoMutex.then((): StorePromo | undefined => {
      const promo = this.db.data.promos.find((p) => p.id === id);
      if (!promo) return undefined;
      if (promo.usageLimit !== undefined && (promo.usedCount ?? 0) >= promo.usageLimit) {
        return undefined;
      }
      const updated: StorePromo = { ...promo, usedCount: (promo.usedCount ?? 0) + 1 };
      this.db.data.promos = this.db.data.promos.map((p) => (p.id === id ? updated : p));
      this.persist();
      return updated;
    });
    // El mutex nunca queda rechazado: un fallo no bloquea los siguientes.
    this.promoMutex = run.catch(() => undefined);
    return run;
  }

  getAdminInitialized(): boolean { return this._adminInitialized; }
  setAdminInitialized(val: boolean): void { this._adminInitialized = val; }
}