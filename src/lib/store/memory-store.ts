import type {
  DataStore,
  StoreData,
  StoreUser,
  StoreOrder,
  Contact,
  Subscriber,
  StoreSettings,
  StorePromo,
} from "./types";
import { initialProducts } from "@/lib/product-data";
import type { Product } from "@/lib/models";
import { DEFAULT_SETTINGS } from "@/lib/models/settings";
import { maybeEncryptJson, maybeDecryptJson, isEncryptedValue } from "@/lib/crypto";

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
  /** Serializa los incrementos atómicos de cupones dentro del proceso. */
  private promoMutex: Promise<unknown> = Promise.resolve();

  constructor() {
    const g = globalThis as Record<string, unknown>;
    if (!g.__store_data) {
      g.__store_data = defaultData();
    }
    this.data = g.__store_data as StoreData;
    if (typeof g.__adminInitialized === "boolean") {
      this._adminInitialized = g.__adminInitialized;
    }
  }

  async getUsers(): Promise<StoreUser[]> {
    return this.data.users;
  }
  async setUsers(users: StoreUser[]): Promise<void> {
    this.data.users = users;
  }
  async getProducts(): Promise<Product[]> {
    return this.data.products;
  }
  async setProducts(products: Product[]): Promise<void> {
    this.data.products = products;
  }
  async getOrders(): Promise<StoreOrder[]> {
    return this.data.orders.map((o) => {
      let shipping: StoreOrder["shipping"];
      if (isEncryptedValue(o.shipping as unknown)) {
        const dec = maybeDecryptJson(o.shipping as unknown);
        shipping =
          typeof dec === "string" && isEncryptedValue(dec)
            ? ({
                name: "[cifrado]",
                email: "",
                phone: "",
                address: "[cifrado]",
                city: "",
                state: "",
                zip: "",
                notes: "",
              } as StoreOrder["shipping"])
            : (dec as StoreOrder["shipping"]);
      } else {
        shipping = o.shipping as StoreOrder["shipping"];
      }
      let payerIdentification = o.payerIdentification as StoreOrder["payerIdentification"];
      if (isEncryptedValue(o.payerIdentification as unknown)) {
        const dec = maybeDecryptJson(o.payerIdentification as unknown);
        payerIdentification =
          typeof dec === "string" && isEncryptedValue(dec)
            ? (o.payerIdentification as StoreOrder["payerIdentification"])
            : (dec as StoreOrder["payerIdentification"]);
      }
      return { ...o, shipping, payerIdentification };
    });
  }
  async setOrders(orders: StoreOrder[]): Promise<void> {
    this.data.orders = orders.map((o) => ({
      ...o,
      shipping: isEncryptedValue(o.shipping as unknown)
        ? o.shipping
        : (maybeEncryptJson(o.shipping) as StoreOrder["shipping"]),
      payerIdentification: o.payerIdentification
        ? isEncryptedValue(o.payerIdentification as unknown)
          ? o.payerIdentification
          : (maybeEncryptJson(o.payerIdentification) as StoreOrder["payerIdentification"])
        : undefined,
    }));
  }
  async getContacts(): Promise<Contact[]> {
    return this.data.contacts;
  }
  async setContacts(contacts: Contact[]): Promise<void> {
    this.data.contacts = contacts;
  }
  async getSubscribers(): Promise<Subscriber[]> {
    return this.data.subscribers;
  }
  async setSubscribers(subscribers: Subscriber[]): Promise<void> {
    this.data.subscribers = subscribers;
  }
  async getSettings(): Promise<StoreSettings> {
    return this.data.settings;
  }
  async setSettings(settings: StoreSettings): Promise<void> {
    this.data.settings = settings;
  }
  async getPromos(): Promise<StorePromo[]> {
    return this.data.promos;
  }
  async setPromos(promos: StorePromo[]): Promise<void> {
    this.data.promos = promos;
  }

  /**
   * Incremento atómico con guard de `usageLimit`. El mutex de promesa
   * encadenada serializa las llamadas concurrentes dentro del proceso:
   * el segundo checkout ve el `usedCount` ya incrementado por el primero.
   */
  tryIncrementPromoUsage(id: string): Promise<StorePromo | undefined> {
    const run = this.promoMutex.then((): StorePromo | undefined => {
      const promo = this.data.promos.find((p) => p.id === id);
      if (!promo) return undefined;
      if (promo.usageLimit !== undefined && (promo.usedCount ?? 0) >= promo.usageLimit) {
        return undefined;
      }
      const updated: StorePromo = { ...promo, usedCount: (promo.usedCount ?? 0) + 1 };
      this.data.promos = this.data.promos.map((p) => (p.id === id ? updated : p));
      return updated;
    });
    // El mutex nunca queda rechazado: un fallo no bloquea los siguientes.
    this.promoMutex = run.catch(() => undefined);
    return run;
  }

  getAdminInitialized(): boolean {
    return this._adminInitialized;
  }
  setAdminInitialized(val: boolean): void {
    this._adminInitialized = val;
  }
}
