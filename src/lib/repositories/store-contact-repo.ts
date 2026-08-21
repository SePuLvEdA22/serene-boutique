import type { Contact } from '@/lib/models';
import type { IContactRepository } from './interfaces';
import { db } from '@/lib/db';

export class StoreContactRepository implements IContactRepository {
  findAll(): Contact[] {
    return db.contacts.get();
  }

  create(contact: Contact): void {
    db.contacts.set([...db.contacts.get(), contact]);
  }

  markRead(id: string, read: boolean): Contact | undefined {
    const contacts = db.contacts.get();
    const target = contacts.find((c) => c.id === id);
    if (!target) return undefined;
    const updated = { ...target, read };
    db.contacts.set(contacts.map((c) => (c.id === id ? updated : c)));
    return updated;
  }

  delete(id: string): boolean {
    const contacts = db.contacts.get();
    const next = contacts.filter((c) => c.id !== id);
    if (next.length === contacts.length) return false;
    db.contacts.set(next);
    return true;
  }
}