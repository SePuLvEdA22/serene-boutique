import type { Product, Category, User, Order, OrderStatus, Contact, Subscriber } from '@/lib/models';
import type { Settings } from '@/lib/models/settings';
import type { Promo } from '@/lib/models/promo';

/**
 * Repositorios async: la capa de datos soporta drivers síncronos (lowdb,
 * memoria) y asíncronos (Postgres/Neon), así que la interfaz es Promise-first.
 */
export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | undefined>;
  findByCategory(category: Category): Promise<Product[]>;
  search(query: string): Promise<Product[]>;
  getFeatured(): Promise<Product[]>;
  create(product: Product): Promise<void>;
  update(id: string, data: Partial<Product>): Promise<Product | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  create(user: User): Promise<void>;
  update(id: string, data: Partial<User>): Promise<void>;
  delete(id: string): Promise<boolean>;
}

export interface IOrderRepository {
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | undefined>;
  findByUser(userId: string): Promise<Order[]>;
  create(order: Order): Promise<void>;
  updateStatus(id: string, status: OrderStatus): Promise<Order | undefined>;
  update(id: string, data: Partial<Order>): Promise<Order | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface IContactRepository {
  findAll(): Promise<Contact[]>;
  create(contact: Contact): Promise<void>;
  markRead(id: string, read: boolean): Promise<Contact | undefined>;
  delete(id: string): Promise<boolean>;
}

export interface ISubscriberRepository {
  findAll(): Promise<Subscriber[]>;
  findByEmail(email: string): Promise<Subscriber | undefined>;
  create(subscriber: Subscriber): Promise<void>;
  delete(id: string): Promise<boolean>;
}

export interface ISettingsRepository {
  get(): Promise<Settings>;
  update(data: Partial<Settings>): Promise<Settings>;
}

export interface IPromoRepository {
  findAll(): Promise<Promo[]>;
  findById(id: string): Promise<Promo | undefined>;
  findByCode(code: string): Promise<Promo | undefined>;
  create(promo: Promo): Promise<void>;
  update(id: string, data: Partial<Promo>): Promise<Promo | undefined>;
  delete(id: string): Promise<boolean>;
  /** Registra un uso del cupón y devuelve el cupón actualizado. */
  incrementUsage(id: string): Promise<Promo | undefined>;
}
