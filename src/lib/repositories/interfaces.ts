import type { Product, Category, User, Order, OrderStatus, Contact, Subscriber } from '@/lib/models';

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
}

export interface IOrderRepository {
  findAll(): Order[];
  findById(id: string): Order | undefined;
  findByUser(userId: string): Order[];
  create(order: Order): void;
  updateStatus(id: string, status: OrderStatus): Order | undefined;
}

export interface IContactRepository {
  findAll(): Contact[];
  create(contact: Contact): void;
}

export interface ISubscriberRepository {
  findAll(): Subscriber[];
  findByEmail(email: string): Subscriber | undefined;
  create(subscriber: Subscriber): void;
}
