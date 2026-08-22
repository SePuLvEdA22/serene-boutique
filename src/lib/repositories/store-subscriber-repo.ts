import type { Subscriber } from '@/lib/models';
import type { ISubscriberRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreSubscriberRepository implements ISubscriberRepository {
  async findAll(): Promise<Subscriber[]> {
    return db.subscribers.get();
  }

  async findByEmail(email: string): Promise<Subscriber | undefined> {
    const subscribers = await db.subscribers.get();
    return subscribers.find(s => s.email === email);
  }

  async create(subscriber: Subscriber): Promise<void> {
    const subscribers = await db.subscribers.get();
    await db.subscribers.set([...subscribers, subscriber]);
  }

  async delete(id: string): Promise<boolean> {
    const subscribers = await db.subscribers.get();
    const next = subscribers.filter((s) => s.id !== id);
    if (next.length === subscribers.length) return false;
    await db.subscribers.set(next);
    return true;
  }
}
