import type { Subscriber } from '@/lib/models';
import type { ISubscriberRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreSubscriberRepository implements ISubscriberRepository {
  findAll(): Subscriber[] {
    return db.subscribers.get();
  }

  findByEmail(email: string): Subscriber | undefined {
    return db.subscribers.get().find(s => s.email === email);
  }

  create(subscriber: Subscriber): void {
    db.subscribers.set([...db.subscribers.get(), subscriber]);
  }

  delete(id: string): boolean {
    const subscribers = db.subscribers.get();
    const next = subscribers.filter((s) => s.id !== id);
    if (next.length === subscribers.length) return false;
    db.subscribers.set(next);
    return true;
  }
}
