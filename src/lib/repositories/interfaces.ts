import type { Product, Category, User, Order, OrderStatus, Contact, Subscriber } from '@/lib/models';
import type { Settings } from '@/lib/models/settings';
import type { Promo } from '@/lib/models/promo';

export interface IProductRepository {
  findAll(): Product[];
  findById(id: string): Product | undefined;
  findByCategory(category: Category): Product[];
  search(query: string): Product[];
  getFeatured(): Product[];
  create(product: Product): void;
  update(id: string, data: Partial<Product>): Product | undefined;
  delete(id: string): boolean;
}

export interface IUserRepository {
  findAll(): User[];
  findById(id: string): User | undefined;
  findByEmail(email: string): User | undefined;
  create(user: User): void;
  update(id: string, data: Partial<User>): void;
  delete(id: string): boolean;
}

export interface IOrderRepository {
  findAll(): Order[];
  findById(id: string): Order | undefined;
  findByUser(userId: string): Order[];
  create(order: Order): void;
  updateStatus(id: string, status: OrderStatus): Order | undefined;
  update(id: string, data: Partial<Order>): Order | undefined;
  delete(id: string): boolean;
}

export interface IContactRepository {
  findAll(): Contact[];
  create(contact: Contact): void;
  markRead(id: string, read: boolean): Contact | undefined;
  delete(id: string): boolean;
}

export interface ISubscriberRepository {
  findAll(): Subscriber[];
  findByEmail(email: string): Subscriber | undefined;
  create(subscriber: Subscriber): void;
  delete(id: string): boolean;
}

export interface ISettingsRepository {
  get(): Settings;
  update(data: Partial<Settings>): Settings;
}

export interface IPromoRepository {
  findAll(): Promo[];
  findById(id: string): Promo | undefined;
  findByCode(code: string): Promo | undefined;
  create(promo: Promo): void;
  update(id: string, data: Partial<Promo>): Promo | undefined;
  delete(id: string): boolean;
  /** Registra un uso del cupón y devuelve el cupón actualizado. */
  incrementUsage(id: string): Promo | undefined;
}
