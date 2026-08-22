import type { Order, OrderStatus } from '@/lib/models';
import type { IOrderRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreOrderRepository implements IOrderRepository {
  async findAll(): Promise<Order[]> {
    return db.orders.get();
  }

  async findById(id: string): Promise<Order | undefined> {
    const orders = await db.orders.get();
    return orders.find(o => o.id === id);
  }

  async findByUser(userId: string): Promise<Order[]> {
    const orders = await db.orders.get();
    return orders.filter(o => o.userId === userId);
  }

  async create(order: Order): Promise<void> {
    const orders = await db.orders.get();
    await db.orders.set([...orders, order]);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
    const list = await db.orders.get();
    const index = list.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    list[index] = { ...list[index], status };
    await db.orders.set(list);
    return list[index];
  }

  async update(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const list = await db.orders.get();
    const index = list.findIndex(o => o.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...data };
    list[index] = updated;
    await db.orders.set(list);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const list = await db.orders.get();
    const index = list.findIndex(o => o.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    await db.orders.set(list);
    return true;
  }
}
