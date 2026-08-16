import type { Order, OrderStatus } from '@/lib/models';
import type { IOrderRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreOrderRepository implements IOrderRepository {
  findAll(): Order[] {
    return db.orders.get();
  }

  findById(id: string): Order | undefined {
    return db.orders.get().find(o => o.id === id);
  }

  findByUser(userId: string): Order[] {
    return db.orders.get().filter(o => o.userId === userId);
  }

  create(order: Order): void {
    db.orders.set([...db.orders.get(), order]);
  }

  updateStatus(id: string, status: OrderStatus): Order | undefined {
    const list = db.orders.get();
    const index = list.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    list[index] = { ...list[index], status };
    db.orders.set(list);
    return list[index];
  }

  update(id: string, data: Partial<Order>): Order | undefined {
    const list = db.orders.get();
    const index = list.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...data };
    list[index] = updated;
    db.orders.set(list);
    return updated;
  }

  delete(id: string): boolean {
    const list = db.orders.get();
    const index = list.findIndex(o => o.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    db.orders.set(list);
    return true;
  }
}
